import { TMDBService } from './services/TMDBService.js';
import { showLoader, hideLoader, clearResults, resultsGrid, modal } from './utils.js';
import { mainLogger } from './logger.js';

/**
 * EventHandlers
 * Módulo centralizado para manejar todos los event listeners de la aplicación
 */
export class EventHandlers {
    constructor(controllers, views, storageSync) {
        this.moviesController = controllers.movies;
        this.searchController = controllers.search;
        this.favoritesController = controllers.favorites;

        this.modalView = views.modal;
        this.moviesView = views.movies;
        this.emptyStateView = views.empty;

        this.storageSync = storageSync;

        this.dom = {
            searchInput: document.getElementById('searchInput'),
            homeButton: document.getElementById('home-button'),
            loadMoreButton: document.getElementById('load-more'),
            genreNav: document.getElementById('genre-nav')
        };
    }

    /**
     * Inicializa todos los event listeners
     */
    init() {
        this.setupNavigationListeners();
        this.setupSearchListeners();
        this.setupGenreListeners();
        this.setupMovieCardListeners();
        this.setupModalListeners();
        this.setupKeyboardListeners();
        this.setupLoadMoreListener();

        mainLogger.info('✅ Event listeners inicializados');
    }

    /**
     * Configura listeners de navegación (sidebar y bottom nav)
     */
    setupNavigationListeners() {
        // Navegación del sidebar
        document.querySelectorAll('.sidebar-nav-item[data-section]').forEach(button => {
            button.addEventListener('click', () => {
                const section = button.dataset.section;
                if (section) {
                    this.handleNavigation(section);
                }
            });
        });

        // Navegación del bottom nav (mobile)
        document.querySelectorAll('.bottom-nav-item[data-section]').forEach(button => {
            button.addEventListener('click', () => {
                const section = button.dataset.section;
                if (section) {
                    this.handleNavigation(section);
                }
            });
        });

        // Home button
        if (this.dom.homeButton) {
            this.dom.homeButton.addEventListener('click', () => {
                mainLogger.info('🏠 Botón Home presionado');
                this.moviesController.navigateToSection('popular');
            });
        }
    }

    /**
     * Maneja la navegación entre secciones
     */
    handleNavigation(section) {
        if (section === 'favorites') {
            this.favoritesController.displayFavorites();
        } else if (section === 'history') {
            this.favoritesController.displayHistory();
        } else {
            this.moviesController.navigateToSection(section);
        }
    }

    /**
     * Configura listeners de búsqueda
     */
    setupSearchListeners() {
        if (!this.dom.searchInput) return;

        const performSearch = async () => {
            const query = this.dom.searchInput.value.trim();

            if (!query) {
                mainLogger.warn('⚠️ Búsqueda vacía ignorada');
                return;
            }

            if (query.length < 2) {
                mainLogger.warn('⚠️ Búsqueda muy corta (mínimo 2 caracteres)');
                return;
            }

            try {
                showLoader();
                const results = await this.searchController.intelligentSearch(query, 1);
                hideLoader();

                if (results) {
                    // Actualizar estado del controlador para permitir paginación
                    this.moviesController.state.set('navigation.currentSection', 'search');
                    this.moviesController.state.set('movies.searchQuery', query);
                    this.moviesController.state.set('navigation.currentEndpoint', `search/multi?query=${encodeURIComponent(query)}`);
                    this.moviesController.state.set('pagination.currentPage', 1);
                    this.moviesController.state.set('pagination.totalPages', results.total_pages);
                    this.moviesController.state.set('movies.cache', results.movies || []);

                    // Procesar y mostrar resultados
                    await this.searchController.processSearchResults(results, query);

                    // Actualizar botón de cargar más
                    this.moviesController._updateLoadMoreButton();

                    // Actualizar contador de resultados
                    if (results.movies) {
                        this.moviesController.updateResultsCount(results.movies.length, results.total_results);
                    }
                }
            } catch (error) {
                hideLoader();
                mainLogger.error('Error en búsqueda:', error);
                this.emptyStateView.show('⚠️ Error de conexión. Por favor verifica tu conexión a Internet e intenta de nuevo.');
            }
        };

        // Enter para buscar
        this.dom.searchInput.addEventListener('keyup', e => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // Buscar al perder foco (opcional)
        this.dom.searchInput.addEventListener('blur', () => {
            const currentQuery = this.moviesController.state.get('movies.searchQuery');
            if (this.dom.searchInput.value.trim() && this.dom.searchInput.value.trim() !== currentQuery) {
                performSearch();
            }
        });
    }

    /**
     * Configura listeners de géneros
     */
    setupGenreListeners() {
        if (!this.dom.genreNav) return;

        this.dom.genreNav.addEventListener('click', async e => {
            const btn = e.target.closest('.genre-btn');
            if (!btn) return;

            if (btn.classList.contains('christmas-genre')) {
                this.moviesController.loadChristmasMovies();
                return;
            }

            const genreName = btn.textContent;
            const genreId = btn.dataset.genreId;

            if (this.moviesController.activeGenreBtn) {
                this.moviesController.activeGenreBtn.classList.remove('active');
            }
            this.moviesController.activeGenreBtn = btn;
            btn.classList.add('active');

            this.moviesController.loadMoviesByGenre(genreId, genreName);
        });
    }

    /**
     * Configura listener para cargar más películas
     */
    setupLoadMoreListener() {
        if (!this.dom.loadMoreButton) return;

        this.dom.loadMoreButton.addEventListener('click', () => {
            this.moviesController.loadMore();
        });
    }

    /**
     * Configura listeners para clicks en tarjetas de películas
     */
    setupMovieCardListeners() {
        if (!resultsGrid) return;

        resultsGrid.addEventListener('click', async e => {
            const card = e.target.closest('.movie-card');
            if (!card) return;

            const movieId = card.dataset.movieId;
            if (!movieId) return;

            try {
                mainLogger.info(`🎬 Abriendo detalles de película ID: ${movieId}`);

                showLoader();
                const data = await TMDBService.getMovieDetails(movieId);
                hideLoader();

                if (data) {
                    this.modalView.showMovieDetails(data);
                } else {
                    alert('No se pudieron cargar los detalles de la película');
                }
            } catch (error) {
                hideLoader();
                mainLogger.error('Error al cargar detalles:', error);
                alert('Error al cargar los detalles de la película');
            }
        });
    }

    /**
     * Configura listeners del modal
     */
    setupModalListeners() {
        if (!modal) return;

        modal.addEventListener('movie-state-changed', () => {
            mainLogger.debug('🔔 Evento movie-state-changed recibido');

            // Sincronizar State con Storage (esto disparará los suscriptores)
            if (this.storageSync) {
                this.storageSync.syncFromStorage();
            }

            this.moviesController.updateGrid();

            // Si estamos en favoritos o historial, recargar la vista
            const currentSection = this.moviesController.state.get('navigation.currentSection');
            if (currentSection === 'favorites') {
                this.favoritesController.displayFavorites();
            } else if (currentSection === 'history') {
                this.favoritesController.displayHistory();
            }
        });
    }

    /**
     * Configura listeners de teclado
     */
    setupKeyboardListeners() {
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
                this.modalView.close();
            }
        });
    }
}
