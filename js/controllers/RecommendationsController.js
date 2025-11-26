import { TMDBService } from '../services/TMDBService.js';
import { Recommendation } from '../ui/components/Recommendation.js';
import { ModalView } from '../ui/views/ModalView.js';
import { showLoader, hideLoader } from '../utils.js';
import Logger from '../logger.js';

export class RecommendationsController {
    constructor(state) {
        this.state = state;
        this.logger = new Logger('RECOMMENDATIONS_CONTROLLER');
        this.dom = {
            recommendButton: document.getElementById('recommend-button'),
            recommendationGenreSelect: document.getElementById('recommendation-genre'),
            viewRecommendedDetails: document.getElementById('view-recommended-details')
        };

        this.MAX_HISTORY = 50;

        // Inicializar componentes
        const recommendedContainer = document.getElementById('recommended-movie');
        this.recommendationComponent = new Recommendation(recommendedContainer);
        this.modalView = new ModalView();

        this.logger.info('🎲 RecommendationsController inicializado con State centralizado');
    }

    init() {
        this._setupEventListeners();
        // El historial ya se carga en StateStorageSync
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
                const genreId = e.target.value;
                this.logger.info(`🔄 Género de recomendación cambiado a: ${selectedGenre}`);

                this.state.set('recommendations.genre', genreId);
                this.resetHistory();
            });
        }

        if (this.dom.viewRecommendedDetails) {
            this.dom.viewRecommendedDetails.addEventListener('click', async () => {
                const currentMovie = this.state.get('recommendations.currentMovie');

                if (!currentMovie) {
                    this.logger.warn('⚠️ No hay película recomendada para mostrar');
                    return;
                }

                try {
                    this.logger.info('📖 Abriendo detalles de recomendación');

                    showLoader();
                    const data = await TMDBService.getMovieDetails(currentMovie.id);
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
        const history = this.state.get('recommendations.history') || [];
        const availableMovies = data.results.filter(
            movie => !history.includes(movie.id)
        );

        const moviesToChooseFrom = availableMovies.length > 0 ? availableMovies : data.results;

        if (availableMovies.length === 0) {
            this.logger.warn('⚠️ Todas las películas ya fueron mostradas, limpiando historial');
            this.state.set('recommendations.history', []);
            // StateStorageSync guardará el cambio
        } else {
            this.logger.debug(`${availableMovies.length} películas no vistas disponibles`);
        }

        // Seleccionar película aleatoria
        const randomIndex = Math.floor(Math.random() * moviesToChooseFrom.length);
        const selectedMovie = moviesToChooseFrom[randomIndex];

        this.state.set('recommendations.currentMovie', selectedMovie);

        this.logger.success(`✓ Película seleccionada: "${selectedMovie.title}"`);
        this.logger.debug('Detalles de la recomendación:', {
            id: selectedMovie.id,
            título: selectedMovie.title,
            puntuación: selectedMovie.vote_average,
            año: selectedMovie.release_date
        });

        // Agregar al historial
        const currentHistory = this.state.get('recommendations.history') || [];
        const newHistory = [...currentHistory, selectedMovie.id];

        // Mantener solo las últimas MAX_HISTORY películas
        if (newHistory.length > this.MAX_HISTORY) {
            const removed = newHistory.shift();
            this.logger.debug(`Película ID ${removed} removida del historial (límite alcanzado)`);
        }

        this.state.set('recommendations.history', newHistory);
        // StateStorageSync guardará el cambio

        this.logger.info(`📝 Historial actualizado: ${newHistory.length}/${this.MAX_HISTORY}`);

        this.recommendationComponent.render(selectedMovie);
    }

    resetHistory() {
        const history = this.state.get('recommendations.history') || [];
        const previousCount = history.length;

        this.state.set('recommendations.history', []);

        this.logger.info(`🔄 Historial reseteado (${previousCount} películas eliminadas)`);
    }
}
