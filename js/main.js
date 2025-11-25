import { TMDBService } from './services/TMDBService.js';
import { StorageService } from './services/StorageService.js';
import { FiltersService } from './services/FiltersService.js';
import { displayMovies, displayRecommendedMovie } from './ui.js';
import { openModal, closeModal } from './modal.js';
import { getRandomMovie, currentRecommendedMovie, resetRecommendationHistory } from './recommendations.js';
import { showLoader, hideLoader, clearResults, showEmptyMessage, sectionTitle, resultsGrid, modal } from './utils.js';
import { mainLogger } from './logger.js';
import { syncNavigationState, updateNavigationBadges, isMobileDevice, initializeMobileNavigation } from './mobile-nav.js';
import { intelligentSearch, processSearchResults } from './search.js';
import { MoviesController } from './controllers/MoviesController.js';

// Inicializar Controlador
const moviesController = new MoviesController();

// Referencias a elementos del DOM
const searchInput = document.getElementById('searchInput');
const genreNav = document.getElementById('genre-nav');
const homeButton = document.getElementById('home-button');
const loadMoreButton = document.getElementById('load-more');
const favoritesButton = document.getElementById('favorites-button');
const historyButton = document.getElementById('history-button');
const mobileFavoritesButton = document.getElementById('mobile-favorites-button');
const mobileHistoryButton = document.getElementById('mobile-history-button');
const viewRecommendedDetails = document.getElementById('view-recommended-details');
const recommendButton = document.getElementById('recommend-button');
const recommendationGenreSelect = document.getElementById('recommendation-genre');

// Referencias a elementos de filtros
const sortBySelect = document.getElementById('sort-by');
const filterYearSelect = document.getElementById('filter-year');
const filterRatingSelect = document.getElementById('filter-rating');
const applyFiltersBtn = document.getElementById('apply-filters');
const resetFiltersBtn = document.getElementById('reset-filters');

mainLogger.info('🚀 MovieFinder iniciando...');

// ============================================
// EVENT LISTENERS DE FILTROS
// ============================================

if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
        mainLogger.info('🔍 Aplicando filtros...');

        moviesController.state.currentFilters.sortBy = sortBySelect.value;
        moviesController.state.currentFilters.year = filterYearSelect.value;
        moviesController.state.currentFilters.rating = filterRatingSelect.value;

        mainLogger.debug('Filtros aplicados:', moviesController.state.currentFilters);

        if (moviesController.state.allMoviesCache.length > 0) {
            const filteredMovies = moviesController.applyFiltersToMovies(moviesController.state.allMoviesCache);
            clearResults();
            displayMovies(filteredMovies);
            moviesController.updateResultsCount(filteredMovies.length, moviesController.state.allMoviesCache.length);
            mainLogger.success(`✓ Filtros aplicados: ${filteredMovies.length} resultados`);
        }
    });
}

if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
        mainLogger.info('🔄 Reseteando filtros...');

        sortBySelect.value = 'default';
        filterYearSelect.value = '';
        filterRatingSelect.value = '';

        moviesController.state.currentFilters = {
            sortBy: 'default',
            year: '',
            rating: ''
        };

        if (moviesController.state.allMoviesCache.length > 0) {
            clearResults();
            displayMovies(moviesController.state.allMoviesCache);
            moviesController.updateResultsCount(moviesController.state.allMoviesCache.length, moviesController.state.allMoviesCache.length);
        }

        mainLogger.success('✓ Filtros reseteados');
    });
}

// ============================================
// EVENT LISTENERS
// ============================================

// Navegación del sidebar
document.querySelectorAll('.sidebar-nav-item[data-section]').forEach(button => {
    button.addEventListener('click', () => {
        const section = button.dataset.section;
        if (section) {
            moviesController.navigateToSection(section);
        }
    });
});

// Navegación del bottom nav (mobile)
document.querySelectorAll('.bottom-nav-item[data-section]').forEach(button => {
    button.addEventListener('click', () => {
        const section = button.dataset.section;
        if (section) {
            moviesController.navigateToSection(section);
        }
    });
});

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
            mainLogger.info(`🔍 Búsqueda inteligente iniciada: "${query}"`);

            showLoader();
            const results = await intelligentSearch(query, 1);
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
                await processSearchResults(results, query);

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
            showEmptyMessage('⚠️ Error de conexión. Por favor verifica tu conexión a Internet e intenta de nuevo.');
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

// Géneros
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
                openModal(data);
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

// Favoritos
if (favoritesButton) {
    favoritesButton.addEventListener('click', () => moviesController.displayFavorites());
}

if (mobileFavoritesButton) {
    mobileFavoritesButton.addEventListener('click', () => moviesController.displayFavorites());
}

// Historial
if (historyButton) {
    historyButton.addEventListener('click', () => moviesController.displayHistory());
}

if (mobileHistoryButton) {
    mobileHistoryButton.addEventListener('click', () => moviesController.displayHistory());
}

// Recomendaciones
if (recommendButton) {
    recommendButton.addEventListener('click', () => {
        mainLogger.info('🎲 Botón Recomendar presionado');
        getRandomMovie();
    });
}

if (recommendationGenreSelect) {
    recommendationGenreSelect.addEventListener('change', (e) => {
        const selectedGenre = e.target.selectedOptions[0].text;
        mainLogger.info(`🔄 Género de recomendación cambiado a: ${selectedGenre}`);
        resetRecommendationHistory();
    });
}

if (viewRecommendedDetails) {
    viewRecommendedDetails.addEventListener('click', async () => {
        if (!currentRecommendedMovie) {
            mainLogger.warn('⚠️ No hay película recomendada para mostrar');
            return;
        }

        try {
            mainLogger.info('📖 Abriendo detalles de recomendación');

            showLoader();
            const data = await TMDBService.getMovieDetails(currentRecommendedMovie.id);
            hideLoader();

            if (data) {
                openModal(data);
            }
        } catch (error) {
            hideLoader();
            mainLogger.error('Error al cargar detalles de recomendación:', error);
        }
    });
}

// Modal
if (modal) {
    modal.addEventListener('movie-state-changed', () => {
        mainLogger.debug('🔔 Evento movie-state-changed recibido');
        moviesController.updateGrid();
    });
}

// Cerrar modal con tecla Escape
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
        closeModal();
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

        // Inicializar controlador
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
        showEmptyMessage('⚠️ Error fatal al inicializar la aplicación');
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