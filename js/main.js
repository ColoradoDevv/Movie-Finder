import { TMDBService } from './services/TMDBService.js';
import { StorageService } from './services/StorageService.js';
import { MoviesView } from './ui/views/MoviesView.js';
import { EmptyStateView } from './ui/views/EmptyStateView.js';
import { ModalView } from './ui/views/ModalView.js';
import { showLoader, hideLoader, clearResults, resultsGrid, modal } from './utils.js';
import { mainLogger } from './logger.js';
import { initializeMobileNavigation } from './mobile-nav.js';

import { MoviesController } from './controllers/MoviesController.js';
import { SearchController } from './controllers/SearchController.js';
import { FiltersController } from './controllers/FiltersController.js';
import { FavoritesController } from './controllers/FavoritesController.js';
import { RecommendationsController } from './controllers/RecommendationsController.js';

// Inicializar Controladores
const moviesController = new MoviesController();
const searchController = new SearchController();
const filtersController = new FiltersController();
const favoritesController = new FavoritesController();
const recommendationsController = new RecommendationsController();

// Inicializar vistas globales
const modalView = new ModalView();
const moviesView = new MoviesView(resultsGrid);
const emptyStateView = new EmptyStateView(resultsGrid);

// Referencias a elementos del DOM
const searchInput = document.getElementById('searchInput');
const homeButton = document.getElementById('home-button');
const loadMoreButton = document.getElementById('load-more');

mainLogger.info('🚀 MovieFinder iniciando...');

// ============================================
// INICIALIZACIÓN DE CONTROLADORES
// ============================================

// Inicializar filtros con callbacks para actualizar la vista
filtersController.init(
    (filters) => { // onApply
        moviesController.state.currentFilters = filters;
        mainLogger.debug('Filtros aplicados:', filters);

        if (moviesController.state.allMoviesCache.length > 0) {
            const filteredMovies = moviesController.applyFiltersToMovies(moviesController.state.allMoviesCache);
            clearResults();
            moviesView.render(filteredMovies);
            moviesController.updateResultsCount(filteredMovies.length, moviesController.state.allMoviesCache.length);
            mainLogger.success(`✓ Filtros aplicados: ${filteredMovies.length} resultados`);
        }
    },
    () => { // onReset
        moviesController.state.currentFilters = {
            sortBy: 'default',
            year: '',
            rating: ''
        };

        if (moviesController.state.allMoviesCache.length > 0) {
            clearResults();
            moviesView.render(moviesController.state.allMoviesCache);
            moviesController.updateResultsCount(moviesController.state.allMoviesCache.length, moviesController.state.allMoviesCache.length);
        }
        mainLogger.success('✓ Filtros reseteados');
    }
);

// Inicializar favoritos y recomendaciones
favoritesController.init();
recommendationsController.init();

// ============================================
// EVENT LISTENERS
// ============================================

// Navegación del sidebar
document.querySelectorAll('.sidebar-nav-item[data-section]').forEach(button => {
    button.addEventListener('click', () => {
        const section = button.dataset.section;
        if (section) {
            handleNavigation(section);
        }
    });
});

// Navegación del bottom nav (mobile)
document.querySelectorAll('.bottom-nav-item[data-section]').forEach(button => {
    button.addEventListener('click', () => {
        const section = button.dataset.section;
        if (section) {
            handleNavigation(section);
        }
    });
});

function handleNavigation(section) {
    if (section === 'favorites') {
        favoritesController.displayFavorites();
    } else if (section === 'history') {
        favoritesController.displayHistory();
    } else {
        moviesController.navigateToSection(section);
    }
}

// Home button
if (homeButton) {
    homeButton.addEventListener('click', () => {
        mainLogger.info('🏠 Botón Home presionado');
        moviesController.navigateToSection('popular');
    });
}

// Búsqueda INTELIGENTE
if (searchInput) {
    const performSearch = async () => {
        const query = searchInput.value.trim();

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
            const results = await searchController.intelligentSearch(query, 1);
            hideLoader();

            if (results) {
                // Actualizar estado del controlador para permitir paginación
                moviesController.state.currentSection = 'search';
                moviesController.state.currentSearchQuery = query;
                moviesController.state.currentEndpoint = `search/multi?query=${encodeURIComponent(query)}`;
                moviesController.state.currentPage = 1;
                moviesController.state.totalPages = results.total_pages;
                moviesController.state.allMoviesCache = results.movies || [];

                // Procesar y mostrar resultados
                await searchController.processSearchResults(results, query);

                // Actualizar botón de cargar más
                moviesController._updateLoadMoreButton();

                // Actualizar contador de resultados
                if (results.movies) {
                    moviesController.updateResultsCount(results.movies.length, results.total_results);
                }
            }
        } catch (error) {
            hideLoader();
            mainLogger.error('Error en búsqueda:', error);
            emptyStateView.show('⚠️ Error de conexión. Por favor verifica tu conexión a Internet e intenta de nuevo.');
        }
    };

    // Enter para buscar
    searchInput.addEventListener('keyup', e => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Buscar al perder foco (opcional)
    searchInput.addEventListener('blur', () => {
        if (searchInput.value.trim() && searchInput.value.trim() !== moviesController.state.currentSearchQuery) {
            performSearch();
        }
    });
}

// Géneros (delegado a MoviesController, pero necesitamos interceptar el click)
const genreNav = document.getElementById('genre-nav');
if (genreNav) {
    genreNav.addEventListener('click', async e => {
        const btn = e.target.closest('.genre-btn');
        if (!btn) return;

        if (btn.classList.contains('christmas-genre')) {
            moviesController.loadChristmasMovies();
            return;
        }

        const genreName = btn.textContent;
        const genreId = btn.dataset.genreId;

        if (moviesController.state.activeGenre) moviesController.state.activeGenre.classList.remove('active');
        moviesController.state.activeGenre = btn;
        btn.classList.add('active');

        moviesController.loadMoviesByGenre(genreId, genreName);
    });
}

// Cargar más
if (loadMoreButton) {
    loadMoreButton.addEventListener('click', () => {
        moviesController.loadMore();
    });
}

// Click en tarjetas de película
if (resultsGrid) {
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
                modalView.showMovieDetails(data);
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

// Modal
if (modal) {
    modal.addEventListener('movie-state-changed', () => {
        mainLogger.debug('🔔 Evento movie-state-changed recibido');
        moviesController.updateGrid();
        favoritesController.updateBadges();

        // Si estamos en favoritos o historial, recargar la vista
        if (moviesController.state.currentSection === 'favorites') {
            favoritesController.displayFavorites();
        } else if (moviesController.state.currentSection === 'history') {
            favoritesController.displayHistory();
        }
    });
}

// Cerrar modal con tecla Escape
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
        modalView.close();
    }
});

// ============================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ============================================

/**
 * Inicializa la aplicación completa
 */
async function initApp() {
    try {
        mainLogger.info('🎬 Inicializando MovieFinder...');
        mainLogger.time('Inicialización completa');

        // Inicializar controlador principal
        await moviesController.init();

        mainLogger.timeEnd('Inicialización completa');
        mainLogger.success('✅ MovieFinder inicializado correctamente');

        // Log de bienvenida
        mainLogger.group('🎉 Bienvenido a MovieFinder');
        mainLogger.info('Películas populares cargadas');
        mainLogger.info(`${StorageService.getFavorites().length} favoritos guardados`);
        mainLogger.info(`${StorageService.getWatchedMovies().length} películas vistas`);
        mainLogger.groupEnd();

    } catch (error) {
        mainLogger.error('❌ Error fatal al inicializar la aplicación:', error);
        emptyStateView.show('⚠️ Error fatal al inicializar la aplicación');
        mainLogger.timeEnd('Inicialización completa');
    }
}

// Iniciar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initApp();
        initializeMobileNavigation();
    });
} else {
    initApp();
    initializeMobileNavigation();
}
