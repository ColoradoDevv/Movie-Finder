import { TMDBService } from '../services/TMDBService.js';
import { StorageService } from '../services/StorageService.js';
import { FiltersService } from '../services/FiltersService.js';
import { displayMovies } from '../ui.js';
import { showLoader, hideLoader, clearResults, showEmptyMessage, sectionTitle, resultsGrid } from '../utils.js';
import { mainLogger } from '../logger.js';
import { syncNavigationState, updateNavigationBadges } from '../mobile-nav.js';

/**
 * MoviesController
 * Gestiona la lógica de negocio relacionada con películas, navegación y listados.
 */
export class MoviesController {
    constructor() {
        // Estado de la aplicación
        this.state = {
            currentPage: 1,
            totalPages: 1,
            currentSection: 'popular',
            currentEndpoint: 'movie/popular',
            activeGenre: null,
            currentSearchQuery: '',
            allMoviesCache: [],
            currentFilters: {
                sortBy: 'default',
                year: '',
                rating: ''
            }
        };

        // Referencias al DOM (se inicializan en init)
        this.dom = {
            loadMoreButton: document.getElementById('load-more'),
            genreNav: document.getElementById('genre-nav'),
            recommendationGenreSelect: document.getElementById('recommendation-genre'),
            searchInput: document.getElementById('searchInput'),
            resultsCount: document.getElementById('results-count')
        };

        mainLogger.info('🎬 MoviesController inicializado');
    }

    /**
     * Inicializa el controlador
     */
    async init() {
        await this.initGenres();
        await this.loadPopularMovies();
        this.updateBadges();
    }

    /**
     * Navega a una sección específica
     * @param {string} section - Identificador de la sección
     */
    async navigateToSection(section) {
        mainLogger.info(`🧭 Navegando a: ${section}`);

        this.state.currentSection = section;
        syncNavigationState(section);

        switch (section) {
            case 'popular':
                await this.loadPopularMovies();
                break;
            case 'top-rated':
                await this.loadTopRatedMovies();
                break;
            case 'upcoming':
                await this.loadUpcomingMovies();
                break;
            case 'favorites':
                this.displayFavorites();
                break;
            case 'history':
                this.displayHistory();
                break;
            default:
                mainLogger.warn(`Sección desconocida: ${section}`);
        }
    }

    /**
     * Carga películas populares
     */
    async loadPopularMovies() {
        await this._loadMoviesSection({
            section: 'popular',
            endpoint: 'movie/popular',
            title: 'Películas Populares',
            logMessage: '⭐ Cargando películas populares...'
        });
    }

    /**
     * Carga películas mejor valoradas
     */
    async loadTopRatedMovies() {
        await this._loadMoviesSection({
            section: 'top-rated',
            endpoint: 'movie/top_rated',
            title: 'Películas Mejor Valoradas',
            logMessage: '⭐ Cargando películas mejor valoradas...'
        });
    }

    /**
     * Carga próximos estrenos
     */
    async loadUpcomingMovies() {
        await this._loadMoviesSection({
            section: 'upcoming',
            endpoint: 'movie/upcoming',
            title: 'Próximos Estrenos',
            logMessage: '📅 Cargando próximos estrenos...'
        });
    }

    /**
     * Carga películas navideñas
     */
    async loadChristmasMovies() {
        mainLogger.info('🎄 Cargando películas navideñas...');

        this.state.currentSection = 'christmas';
        this.state.currentEndpoint = 'search/movie?query=christmas';
        sectionTitle.textContent = '🎄 Películas Navideñas';
        sectionTitle.classList.add('christmas-title');
        this.resetSearchAndFilters();

        if (this.state.activeGenre) {
            this.state.activeGenre.classList.remove('active');
        }

        const christmasGenreBtn = document.querySelector('.genre-btn.christmas-genre');
        if (christmasGenreBtn) {
            this.state.activeGenre = christmasGenreBtn;
            christmasGenreBtn.classList.add('active');
        }

        showLoader();
        try {
            const data = await TMDBService.getMovies(this.state.currentEndpoint, 1);
            hideLoader();

            if (data && data.results && data.results.length > 0) {
                const christmasMovies = data.results.filter(movie => {
                    const title = (movie.title || '').toLowerCase();
                    const originalTitle = (movie.original_title || '').toLowerCase();
                    return title.includes('christmas') ||
                        title.includes('navidad') ||
                        title.includes('santa') ||
                        title.includes('noel') ||
                        title.includes('holiday') ||
                        originalTitle.includes('christmas') ||
                        originalTitle.includes('santa');
                });

                clearResults();

                if (christmasMovies.length > 0) {
                    this.state.allMoviesCache = [...christmasMovies];
                    displayMovies(christmasMovies);
                    this.state.currentPage = 1;
                    this.state.totalPages = data.total_pages;
                    this._updateLoadMoreButton();
                    mainLogger.success(`✓ ${christmasMovies.length} películas navideñas cargadas`);
                } else {
                    this.state.allMoviesCache = [...data.results];
                    displayMovies(data.results);
                    this.state.currentPage = 1;
                    this.state.totalPages = data.total_pages;
                    this._updateLoadMoreButton();
                    mainLogger.success(`✓ ${data.results.length} películas relacionadas cargadas`);
                }
            } else {
                showEmptyMessage('No se encontraron películas navideñas. Intenta más tarde.');
            }
        } catch (error) {
            hideLoader();
            mainLogger.error('Error al cargar películas navideñas:', error);
            this._showNetworkError();
        }
    }

    /**
     * Carga películas por género
     * @param {string} genreId - ID del género
     * @param {string} genreName - Nombre del género
     */
    async loadMoviesByGenre(genreId, genreName) {
        mainLogger.info(`🎭 Filtro de género aplicado: ${genreName}`);

        this.state.currentSection = 'genre';
        this.state.currentEndpoint = `discover/movie?with_genres=${genreId}`;
        sectionTitle.textContent = genreName;
        sectionTitle.classList.remove('christmas-title');
        this.resetSearchAndFilters();

        showLoader();
        try {
            const data = await TMDBService.getMovies(this.state.currentEndpoint, 1);
            hideLoader();

            if (data) {
                clearResults();
                this.state.allMoviesCache = [...data.results];
                displayMovies(data.results);
                this.state.currentPage = 1;
                this.state.totalPages = data.total_pages;
                this._updateLoadMoreButton();
                mainLogger.success(`✓ ${data.results.length} películas de ${genreName}`);
            }
        } catch (error) {
            hideLoader();
            mainLogger.error('Error al filtrar por género:', error);
            this._showNetworkError();
        }
    }

    /**
     * Carga más resultados (paginación)
     */
    async loadMore() {
        if (this.state.currentPage >= this.state.totalPages) return;

        try {
            mainLogger.info(`📄 Cargando página ${this.state.currentPage + 1}/${this.state.totalPages}...`);

            showLoader();
            const data = await TMDBService.getMovies(this.state.currentEndpoint, this.state.currentPage + 1);
            hideLoader();

            if (data && data.results) {
                // Filtrar resultados que no sean películas (ej. personas en búsqueda mixta)
                const newMovies = data.results.filter(item => item.media_type === 'movie' || !item.media_type);

                // Agregar a cache
                this.state.allMoviesCache = [...this.state.allMoviesCache, ...newMovies];

                // Aplicar filtros a las nuevas películas
                const filteredNewMovies = this.applyFiltersToMovies(newMovies);

                // Mostrar solo las nuevas películas filtradas
                displayMovies(filteredNewMovies);

                // Actualizar contador con todas las películas filtradas
                const allFilteredMovies = this.applyFiltersToMovies(this.state.allMoviesCache);
                this.updateResultsCount(allFilteredMovies.length, this.state.allMoviesCache.length);

                this.state.currentPage = data.page;
                if (this.state.currentPage >= data.total_pages) {
                    if (this.dom.loadMoreButton) this.dom.loadMoreButton.style.display = 'none';
                    mainLogger.info('✓ Todas las páginas cargadas');
                }

                mainLogger.success(`✓ Página ${this.state.currentPage} cargada y filtrada`);
            }
        } catch (error) {
            hideLoader();
            mainLogger.error('Error al cargar más películas:', error);
            this._showNetworkError();
        }
    }

    /**
     * Muestra la lista de favoritos
     */
    displayFavorites() {
        mainLogger.info('❤️ Mostrando favoritos...');
        this.state.currentSection = 'favorites';
        sectionTitle.textContent = 'Mis favoritos';
        sectionTitle.classList.remove('christmas-title');

        const favorites = StorageService.getFavorites();
        clearResults();
        if (this.dom.loadMoreButton) this.dom.loadMoreButton.style.display = 'none';
        this.state.allMoviesCache = [];

        if (favorites.length === 0) {
            showEmptyMessage('Aún no tienes películas en favoritos');
        } else {
            displayMovies(favorites);
            mainLogger.success(`✓ Mostrando ${favorites.length} favoritos`);
        }

        syncNavigationState('favorites');
    }

    /**
     * Muestra el historial de vistas
     */
    displayHistory() {
        mainLogger.info('📺 Mostrando historial...');
        this.state.currentSection = 'history';
        sectionTitle.textContent = 'Películas vistas';
        sectionTitle.classList.remove('christmas-title');

        const watched = StorageService.getWatchedMovies();
        clearResults();
        if (this.dom.loadMoreButton) this.dom.loadMoreButton.style.display = 'none';
        this.state.allMoviesCache = [];

        if (watched.length === 0) {
            showEmptyMessage('Aún no has marcado ninguna película como vista');
        } else {
            displayMovies(watched);
            mainLogger.success(`✓ Mostrando ${watched.length} películas vistas`);
        }

        syncNavigationState('history');
    }

    /**
     * Inicializa los géneros en el sidebar
     */
    async initGenres() {
        try {
            mainLogger.info('📂 Inicializando géneros...');
            mainLogger.time('Carga de géneros');

            const data = await TMDBService.loadGenres();

            if (!data || !data.genres) {
                mainLogger.error('✗ No se pudieron cargar los géneros');
                return;
            }

            // Limpiar contenedor
            if (this.dom.genreNav) this.dom.genreNav.innerHTML = '';
            if (this.dom.recommendationGenreSelect) {
                // Mantener la opción por defecto
                const defaultOption = this.dom.recommendationGenreSelect.querySelector('option[value=""]');
                this.dom.recommendationGenreSelect.innerHTML = '';
                if (defaultOption) this.dom.recommendationGenreSelect.appendChild(defaultOption);
            }

            // Crear botón especial de navidad
            const christmasBtn = document.createElement('button');
            christmasBtn.className = 'genre-btn christmas-genre';
            christmasBtn.textContent = 'Películas Navideñas';
            christmasBtn.dataset.genreId = 'christmas';
            christmasBtn.setAttribute('aria-label', 'Filtrar películas navideñas');
            if (this.dom.genreNav) this.dom.genreNav.appendChild(christmasBtn);

            // Agregar el resto de géneros
            data.genres.forEach(genre => {
                if (this.dom.genreNav) {
                    const btn = document.createElement('button');
                    btn.className = 'genre-btn';
                    btn.textContent = genre.name;
                    btn.dataset.genreId = genre.id;
                    btn.setAttribute('aria-label', `Filtrar por ${genre.name}`);
                    this.dom.genreNav.appendChild(btn);
                }

                if (this.dom.recommendationGenreSelect) {
                    const option = document.createElement('option');
                    option.value = genre.id;
                    option.textContent = genre.name;
                    this.dom.recommendationGenreSelect.appendChild(option);
                }
            });

            mainLogger.timeEnd('Carga de géneros');
            mainLogger.success(`✓ ${data.genres.length + 1} géneros cargados`);
        } catch (error) {
            mainLogger.error('Error al inicializar géneros:', error);
        }
    }

    /**
     * Actualiza el grid de resultados (para cambios de estado como fav/watched)
     */
    updateGrid() {
        mainLogger.debug('🔄 Actualizando grid de películas...');

        if (this.state.currentSection === 'favorites') {
            this.displayFavorites();
            return;
        } else if (this.state.currentSection === 'history') {
            this.displayHistory();
            return;
        }

        const cards = resultsGrid.querySelectorAll('.movie-card');
        cards.forEach(card => {
            const movieId = parseInt(card.dataset.movieId);
            const cardIsFavorite = StorageService.isFavorite(movieId);
            const cardIsWatched = StorageService.isWatched(movieId);

            // Re-renderizamos los badges
            const existingBadges = card.querySelectorAll('.movie-status');
            existingBadges.forEach(badge => badge.remove());

            const fragment = document.createDocumentFragment();

            if (cardIsFavorite) {
                const favBadge = document.createElement('span');
                favBadge.className = 'movie-status';
                favBadge.style.color = '#e50914';
                favBadge.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
                fragment.appendChild(favBadge);
            }

            if (cardIsWatched) {
                const watchBadge = document.createElement('span');
                watchBadge.className = 'movie-status';
                watchBadge.style.color = '#46d369';
                watchBadge.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                fragment.appendChild(watchBadge);
            }

            if (fragment.childNodes.length > 0) {
                card.insertBefore(fragment, card.firstChild);
            }
        });

        this.updateBadges();
    }

    updateBadges() {
        updateNavigationBadges(StorageService.getFavorites().length, StorageService.getWatchedMovies().length);
    }

    // Métodos privados y helpers

    async _loadMoviesSection({ section, endpoint, title, logMessage }) {
        try {
            mainLogger.info(logMessage);

            this.state.currentSection = section;
            this.state.currentEndpoint = endpoint;
            sectionTitle.textContent = title;
            sectionTitle.classList.remove('christmas-title');
            this.resetSearchAndFilters();

            if (this.state.activeGenre) {
                this.state.activeGenre.classList.remove('active');
                this.state.activeGenre = null;
            }

            showLoader();
            const data = await TMDBService.getMovies(this.state.currentEndpoint, 1);
            hideLoader();

            if (data && data.results) {
                clearResults();
                this.state.allMoviesCache = [...data.results];
                const filteredMovies = this.applyFiltersToMovies(this.state.allMoviesCache);
                displayMovies(filteredMovies);
                this.updateResultsCount(filteredMovies.length, this.state.allMoviesCache.length);

                this.state.currentPage = 1;
                this.state.totalPages = data.total_pages;
                this._updateLoadMoreButton();

                mainLogger.success(`✓ ${title} cargadas (Página 1/${this.state.totalPages})`);
            } else {
                showEmptyMessage(`No se pudieron cargar ${title.toLowerCase()}`);
                this.updateResultsCount(0, 0);
            }
        } catch (error) {
            hideLoader();
            mainLogger.error(`Error al cargar ${title.toLowerCase()}:`, error);
            this._showNetworkError();
        }
    }

    resetSearchAndFilters() {
        if (this.dom.searchInput) this.dom.searchInput.value = '';
        this.state.currentSearchQuery = '';
        // Reset filters logic should be here or handled by FiltersController later
    }

    applyFiltersToMovies(movies) {
        return FiltersService.applyFilters(movies, this.state.currentFilters);
    }

    updateResultsCount(count, total) {
        if (this.dom.resultsCount) {
            if (count === total) {
                this.dom.resultsCount.textContent = `Mostrando ${count} ${count === 1 ? 'película' : 'películas'}`;
            } else {
                this.dom.resultsCount.textContent = `Mostrando ${count} de ${total} ${total === 1 ? 'película' : 'películas'}`;
            }
        }
    }

    _updateLoadMoreButton() {
        if (this.dom.loadMoreButton) {
            this.dom.loadMoreButton.style.display = this.state.totalPages > 1 ? 'block' : 'none';
        }
    }

    _showNetworkError() {
        showEmptyMessage('⚠️ Error de conexión. Por favor verifica tu conexión a Internet e intenta de nuevo.');
    }
}