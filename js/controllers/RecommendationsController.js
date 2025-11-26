import { TMDBService } from '../services/TMDBService.js';
import { Recommendation } from '../ui/components/Recommendation.js';
import { ModalView } from '../ui/views/ModalView.js';
import { showLoader, hideLoader } from '../utils.js';
import Logger from '../logger.js';

export class RecommendationsController {
    constructor() {
        this.logger = new Logger('RECOMMENDATIONS_CONTROLLER');
        this.dom = {
            recommendButton: document.getElementById('recommend-button'),
            recommendationGenreSelect: document.getElementById('recommendation-genre'),
            viewRecommendedDetails: document.getElementById('view-recommended-details')
        };
        this.currentRecommendedMovie = null;
        this.STORAGE_KEY = 'moviefinder_recommendation_history';
        this.MAX_HISTORY = 50;

        // Inicializar componentes
        const recommendedContainer = document.getElementById('recommended-movie');
        this.recommendationComponent = new Recommendation(recommendedContainer);
        this.modalView = new ModalView();

        this.logger.info('🎲 RecommendationsController inicializado');
    }

    init() {
        this._setupEventListeners();
        this._loadHistory();
    }

    _setupEventListeners() {
        if (this.dom.recommendButton) {
            this.dom.recommendButton.addEventListener('click', () => {
                this.logger.info('🎲 Botón Recomendar presionado');
                this.getRandomMovie();
            });
        }

        if (this.dom.recommendationGenreSelect) {
            this.dom.recommendationGenreSelect.addEventListener('change', (e) => {
                const selectedGenre = e.target.selectedOptions[0].text;
                this.logger.info(`🔄 Género de recomendación cambiado a: ${selectedGenre}`);
                this.resetHistory();
            });
        }

        if (this.dom.viewRecommendedDetails) {
            this.dom.viewRecommendedDetails.addEventListener('click', async () => {
                if (!this.currentRecommendedMovie) {
                    this.logger.warn('⚠️ No hay película recomendada para mostrar');
                    return;
                }

                try {
                    this.logger.info('📖 Abriendo detalles de recomendación');

                    showLoader();
                    const data = await TMDBService.getMovieDetails(this.currentRecommendedMovie.id);
                    hideLoader();

                    if (data) {
                        this.modalView.showMovieDetails(data);
                    }
                } catch (error) {
                    hideLoader();
                    this.logger.error('Error al cargar detalles de recomendación:', error);
                }
            });
        }
    }

    _loadHistory() {
        try {
            this.history = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
            this.logger.debug(`📖 Historial cargado: ${this.history.length} películas`);
        } catch (error) {
            this.logger.error('Error al cargar historial:', error);
            this.history = [];
        }
    }

    _saveHistory() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.history));
            this.logger.debug(`💾 Historial guardado: ${this.history.length} películas`);
        } catch (error) {
            this.logger.error('Error al guardar historial:', error);
        }
    }

    async getRandomMovie() {
        const genreId = this.dom.recommendationGenreSelect ? this.dom.recommendationGenreSelect.value : '';
        const genreName = genreId && this.dom.recommendationGenreSelect
            ? this.dom.recommendationGenreSelect.selectedOptions[0].text
            : 'Cualquier género';

        this.logger.info(`🎬 Solicitando recomendación de: ${genreName}`);

        // Usar múltiples páginas aleatorias para mayor variedad
        const randomPage = Math.floor(Math.random() * 5) + 1;
        this.logger.debug(`Página aleatoria seleccionada: ${randomPage}`);

        const endpoint = genreId
            ? `discover/movie?with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=500&page=${randomPage}`
            : `movie/top_rated?page=${randomPage}`;

        showLoader();
        const data = await TMDBService.fetchFromAPI(endpoint);
        hideLoader();

        if (!data || !data.results || data.results.length === 0) {
            this.logger.error('No se pudieron obtener películas para recomendar');
            alert('No se pudo obtener una recomendación. Intenta de nuevo.');
            return;
        }

        this.logger.info(`📊 ${data.results.length} candidatos disponibles`);

        // Filtrar películas que ya fueron recomendadas recientemente
        const availableMovies = data.results.filter(
            movie => !this.history.includes(movie.id)
        );

        const moviesToChooseFrom = availableMovies.length > 0 ? availableMovies : data.results;

        if (availableMovies.length === 0) {
            this.logger.warn('⚠️ Todas las películas ya fueron mostradas, limpiando historial');
            this.history = [];
            this._saveHistory();
        } else {
            this.logger.debug(`${availableMovies.length} películas no vistas disponibles`);
        }

        // Seleccionar película aleatoria
        const randomIndex = Math.floor(Math.random() * moviesToChooseFrom.length);
        this.currentRecommendedMovie = moviesToChooseFrom[randomIndex];

        this.logger.success(`✓ Película seleccionada: "${this.currentRecommendedMovie.title}"`);
        this.logger.debug('Detalles de la recomendación:', {
            id: this.currentRecommendedMovie.id,
            título: this.currentRecommendedMovie.title,
            puntuación: this.currentRecommendedMovie.vote_average,
            año: this.currentRecommendedMovie.release_date
        });

        // Agregar al historial
        this.history.push(this.currentRecommendedMovie.id);

        // Mantener solo las últimas MAX_HISTORY películas
        if (this.history.length > this.MAX_HISTORY) {
            const removed = this.history.shift();
            this.logger.debug(`Película ID ${removed} removida del historial (límite alcanzado)`);
        }

        // Guardar historial persistente
        this._saveHistory();
        this.logger.info(`📝 Historial actualizado y guardado: ${this.history.length}/${this.MAX_HISTORY}`);

        this.recommendationComponent.render(this.currentRecommendedMovie);
    }

    resetHistory() {
        const previousCount = this.history.length;
        this.history = [];
        this._saveHistory();
        this.logger.info(`🔄 Historial reseteado (${previousCount} películas eliminadas)`);
    }
}
