import { loadGenres, getMovies, getMovieDetails } from './api.js';
import { displayMovies, displayRecommendedMovie } from './ui.js';
import { openModal } from './modal.js';
import { getRandomMovie, currentRecommendedMovie, resetRecommendationHistory } from './recommendations.js';
import { getFavorites, getWatchedMovies, isFavorite, isWatched } from './storage.js';
import { showLoader, hideLoader, clearResults, showEmptyMessage, sectionTitle, resultsGrid, modal } from './utils.js';
import { mainLogger } from './logger.js';
import { syncNavigationState, updateNavigationBadges, isMobileDevice, initializeMobileNavigation } from './mobile-nav.js';

mainLogger.info('🚀 MovieFinder iniciando...');

// Estado de la aplicación
let currentPage = 1;
let totalPages = 1;
let currentEndpoint = 'movie/popular';
let activeGenre = null;
let currentSection = 'popular';
let allMoviesCache = [];
let currentFilters = {
    sortBy: 'default',
    year: '',
    rating: ''
};

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
const resultsCount = document.getElementById('results-count');

// Referencias a botones de navegación del sidebar
const sidebarNavButtons = document.querySelectorAll('.sidebar-nav-item[data-section]');
const bottomNavButtons = document.querySelectorAll('.bottom-nav-item[data-section]');

mainLogger.info('🚀 MovieFinder iniciando...');
mainLogger.group('Estado inicial de la aplicación');
mainLogger.info(`Sección actual: ${currentSection}`);
mainLogger.info(`Endpoint actual: ${currentEndpoint}`);
mainLogger.info(`Página actual: ${currentPage}/${totalPages}`);
mainLogger.groupEnd();

// ============================================
// INICIALIZACIÓN
// ============================================

async function initApp() {
    mainLogger.group('🚀 Inicialización de MovieFinder');
    mainLogger.time('Tiempo total de inicialización');
    
    try {
        // CRÍTICO: Inicializar navegación móvil PRIMERO
        mainLogger.info('Paso 0: Inicializando navegación móvil...');
        initializeMobileNavigation();
        
        mainLogger.info('Paso 1: Cargando géneros...');
        await initGenres();
        
        mainLogger.info('Paso 2: Cargando películas populares...');
        await loadPopularMovies();
        
        mainLogger.info('Paso 3: Sincronizando estado de navegación...');
        syncNavigationState('popular');
        
        mainLogger.info('Paso 4: Actualizando badges...');
        updateNavigationBadges(getFavorites().length, getWatchedMovies().length);
        
        mainLogger.timeEnd('Tiempo total de inicialización');
        mainLogger.success('✅ MovieFinder inicializado correctamente');
        mainLogger.groupEnd();
        
        // Resumen final
        mainLogger.group('📊 Estado final de la aplicación');
        mainLogger.info(`Sección: ${currentSection}`);
        mainLogger.info(`Total páginas: ${totalPages}`);
        mainLogger.info(`Favoritos: ${getFavorites().length}`);
        mainLogger.info(`Vistas: ${getWatchedMovies().length}`);
        mainLogger.info(`Dispositivo: ${isMobileDevice() ? 'Móvil' : 'Desktop'}`);
        mainLogger.groupEnd();
        
    } catch (error) {
        mainLogger.timeEnd('Tiempo total de inicialización');
        mainLogger.error('❌ Error crítico al inicializar la aplicación:', error);
        mainLogger.groupEnd();
        showEmptyMessage('Error al cargar la aplicación. Recarga la página.');
    }
}

// Esperar a que el DOM esté completamente cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        mainLogger.info('⏳ DOM listo, iniciando aplicación...');
        initApp();
    });
} else {
    mainLogger.info('⏳ DOM ya listo, iniciando aplicación...');
    initApp();
}
// FUNCIONES DE NAVEGACIÓN
// ============================================

/**
 * Maneja la navegación entre secciones
 */
async function navigateToSection(section) {
    mainLogger.info(`🧭 Navegando a: ${section}`);
    
    currentSection = section;
    syncNavigationState(section);
    
    switch (section) {
        case 'popular':
            await loadPopularMovies();
            break;
        case 'top-rated':
            await loadTopRatedMovies();
            break;
        case 'upcoming':
            await loadUpcomingMovies();
            break;
        default:
            mainLogger.warn(`Sección desconocida: ${section}`);
    }
}

/**
 * Carga películas mejor valoradas
 */
async function loadTopRatedMovies() {
    try {
        mainLogger.info('⭐ Cargando películas mejor valoradas...');
        
        currentSection = 'top-rated';
        currentEndpoint = 'movie/top_rated';
        sectionTitle.textContent = 'Películas mejor valoradas';
        sectionTitle.classList.remove('christmas-title');
        searchInput.value = '';
        allMoviesCache = [];

        if (activeGenre) {
            activeGenre.classList.remove('active');
            activeGenre = null;
        }

        showLoader();
        const data = await getMovies(currentEndpoint, 1);
        hideLoader();
        
        if (data && data.results) {
            clearResults();
            allMoviesCache = [...data.results];
            const filteredMovies = applyFiltersToMovies(allMoviesCache);
            displayMovies(filteredMovies);
            updateResultsCount(filteredMovies.length, allMoviesCache.length);
            currentPage = 1;
            totalPages = data.total_pages;
            loadMoreButton.style.display = totalPages > 1 ? 'block' : 'none';
            
            mainLogger.success(`✓ Películas mejor valoradas cargadas (Página 1/${totalPages})`);
        } else {
            showEmptyMessage('No se pudieron cargar las películas mejor valoradas');
            updateResultsCount(0, 0);
        }
    } catch (error) {
        hideLoader();
        mainLogger.error('Error al cargar películas mejor valoradas:', error);
        showEmptyMessage('Error al cargar las películas. Intenta de nuevo.');
    }
}

/**
 * Carga películas próximamente
 */
async function loadUpcomingMovies() {
    try {
        mainLogger.info('📅 Cargando próximos estrenos...');
        
        currentSection = 'upcoming';
        currentEndpoint = 'movie/upcoming';
        sectionTitle.textContent = 'Próximos estrenos';
        sectionTitle.classList.remove('christmas-title');
        searchInput.value = '';
        allMoviesCache = [];

        if (activeGenre) {
            activeGenre.classList.remove('active');
            activeGenre = null;
        }

        showLoader();
        const data = await getMovies(currentEndpoint, 1);
        hideLoader();
        
        if (data && data.results) {
            clearResults();
            allMoviesCache = [...data.results];
            const filteredMovies = applyFiltersToMovies(allMoviesCache);
            displayMovies(filteredMovies);
            updateResultsCount(filteredMovies.length, allMoviesCache.length);
            currentPage = 1;
            totalPages = data.total_pages;
            loadMoreButton.style.display = totalPages > 1 ? 'block' : 'none';
            
            mainLogger.success(`✓ Próximos estrenos cargados (Página 1/${totalPages})`);
        } else {
            showEmptyMessage('No se pudieron cargar los próximos estrenos');
            updateResultsCount(0, 0);
        }
    } catch (error) {
        hideLoader();
        mainLogger.error('Error al cargar próximos estrenos:', error);
        showEmptyMessage('Error al cargar las películas. Intenta de nuevo.');
    }
}

// ============================================
// FUNCIONES DE FILTRADO
// ============================================

function applyFiltersToMovies(movies) {
    if (!Array.isArray(movies) || movies.length === 0) {
        return movies;
    }

    let filteredMovies = [...movies];

    // Filtrar por año
    if (currentFilters.year) {
        filteredMovies = filteredMovies.filter(movie => {
            if (!movie.release_date) return false;
            const year = new Date(movie.release_date).getFullYear();
            
            switch (currentFilters.year) {
                case '2024':
                case '2023':
                case '2022':
                case '2021':
                case '2020':
                    return year === parseInt(currentFilters.year);
                case '2010s':
                    return year >= 2010 && year <= 2019;
                case '2000s':
                    return year >= 2000 && year <= 2009;
                case '1990s':
                    return year >= 1990 && year <= 1999;
                case '1980s':
                    return year >= 1980 && year <= 1989;
                case 'classic':
                    return year < 1980;
                default:
                    return true;
            }
        });
    }

    // Filtrar por calificación
    if (currentFilters.rating) {
        const minRating = parseFloat(currentFilters.rating);
        filteredMovies = filteredMovies.filter(movie => {
            return (movie.vote_average || 0) >= minRating;
        });
    }

    // Ordenar
    switch (currentFilters.sortBy) {
        case 'title-asc':
            filteredMovies.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            break;
        case 'rating-desc':
            filteredMovies.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
            break;
        case 'date-desc':
            filteredMovies.sort((a, b) => {
                const dateA = new Date(a.release_date || '1900-01-01');
                const dateB = new Date(b.release_date || '1900-01-01');
                return dateB - dateA;
            });
            break;
        case 'popularity-desc':
            filteredMovies.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
            break;
        default:
            break;
    }

    return filteredMovies;
}

function updateResultsCount(count, total) {
    if (resultsCount) {
        if (count === total) {
            resultsCount.textContent = `Mostrando ${count} ${count === 1 ? 'película' : 'películas'}`;
        } else {
            resultsCount.textContent = `Mostrando ${count} de ${total} ${total === 1 ? 'película' : 'películas'}`;
        }
    }
}

// ============================================
// EVENT LISTENERS DE FILTROS
// ============================================

if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
        mainLogger.info('🔍 Aplicando filtros...');
        
        currentFilters.sortBy = sortBySelect.value;
        currentFilters.year = filterYearSelect.value;
        currentFilters.rating = filterRatingSelect.value;
        
        mainLogger.debug('Filtros aplicados:', currentFilters);

        if (allMoviesCache.length > 0) {
            const filteredMovies = applyFiltersToMovies(allMoviesCache);
            clearResults();
            displayMovies(filteredMovies);
            updateResultsCount(filteredMovies.length, allMoviesCache.length);
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
        
        currentFilters = {
            sortBy: 'default',
            year: '',
            rating: ''
        };

        if (allMoviesCache.length > 0) {
            clearResults();
            displayMovies(allMoviesCache);
            updateResultsCount(allMoviesCache.length, allMoviesCache.length);
        }
        
        mainLogger.success('✓ Filtros reseteados');
    });
}

// ============================================
// FUNCIONES PRINCIPALES (del código original)
// ============================================

function updateGrid() {
    mainLogger.debug('🔄 Actualizando grid de películas...');
    
    if (currentSection === 'favorites') {
        displayFavorites();
    } else if (currentSection === 'history') {
        displayHistory();
    } else {
        mainLogger.time('Actualización de estados en grid');
        
        const cards = resultsGrid.querySelectorAll('.movie-card');
        mainLogger.debug(`Actualizando ${cards.length} tarjetas`);
        
        cards.forEach(card => {
            const movieId = parseInt(card.dataset.movieId);
            const cardIsFavorite = isFavorite(movieId);
            const cardIsWatched = isWatched(movieId);
            
            const favoriteIcon = `<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>`;
            
            const watchedIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>`;
            
            const existingBadges = card.querySelectorAll('.movie-status');
            existingBadges.forEach(badge => badge.remove());
            
            const fragment = document.createDocumentFragment();
            
            if (cardIsFavorite) {
                const favBadge = document.createElement('span');
                favBadge.className = 'movie-status';
                favBadge.style.color = '#e50914';
                favBadge.innerHTML = favoriteIcon;
                fragment.appendChild(favBadge);
            }
            
            if (cardIsWatched) {
                const watchBadge = document.createElement('span');
                watchBadge.className = 'movie-status';
                watchBadge.style.color = '#46d369';
                watchBadge.innerHTML = watchedIcon;
                fragment.appendChild(watchBadge);
            }
            
            if (fragment.childNodes.length > 0) {
                card.insertBefore(fragment, card.firstChild);
            }
        });
        
        mainLogger.timeEnd('Actualización de estados en grid');
        mainLogger.success('✓ Grid actualizado exitosamente');
    }
    
    // Actualizar badges de navegación
    updateNavigationBadges(getFavorites().length, getWatchedMovies().length);
}

async function initGenres() {
    try {
        mainLogger.info('📂 Inicializando géneros...');
        mainLogger.time('Carga de géneros');
        
        const data = await loadGenres();
        
        if (!data || !data.genres) {
            mainLogger.error('✗ No se pudieron cargar los géneros');
            return;
        }

        mainLogger.debug(`Procesando ${data.genres.length} géneros`);

        // Crear botón especial de navidad PRIMERO
        const christmasBtn = document.createElement('button');
        christmasBtn.className = 'genre-btn christmas-genre';
        christmasBtn.textContent = 'Películas Navideñas';
        christmasBtn.dataset.genreId = 'christmas';
        christmasBtn.setAttribute('aria-label', 'Filtrar películas navideñas');
        genreNav.appendChild(christmasBtn);

        // Agregar el resto de géneros
        data.genres.forEach(genre => {
            const btn = document.createElement('button');
            btn.className = 'genre-btn';
            btn.textContent = genre.name;
            btn.dataset.genreId = genre.id;
            btn.setAttribute('aria-label', `Filtrar por ${genre.name}`);
            genreNav.appendChild(btn);
            
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            recommendationGenreSelect.appendChild(option);
        });
        
        mainLogger.timeEnd('Carga de géneros');
        mainLogger.success(`✓ ${data.genres.length + 1} géneros cargados (incluido Navidad)`);
    } catch (error) {
        mainLogger.error('Error al inicializar géneros:', error);
    }
}

async function loadPopularMovies() {
    try {
        mainLogger.info('⭐ Cargando películas populares...');
        
        currentSection = 'popular';
        currentEndpoint = 'movie/popular';
        sectionTitle.textContent = 'Películas populares';
        sectionTitle.classList.remove('christmas-title');
        searchInput.value = '';
        allMoviesCache = [];

        if (activeGenre) {
            activeGenre.classList.remove('active');
            activeGenre = null;
        }

        showLoader();
        const data = await getMovies(currentEndpoint, 1);
        hideLoader();
        
        if (data && data.results) {
            clearResults();
            allMoviesCache = [...data.results];
            const filteredMovies = applyFiltersToMovies(allMoviesCache);
            displayMovies(filteredMovies);
            updateResultsCount(filteredMovies.length, allMoviesCache.length);
            currentPage = 1;
            totalPages = data.total_pages;
            loadMoreButton.style.display = totalPages > 1 ? 'block' : 'none';
            
            mainLogger.success(`✓ Películas populares cargadas (Página 1/${totalPages})`);
        } else {
            showEmptyMessage('No se pudieron cargar las películas populares');
            updateResultsCount(0, 0);
        }
    } catch (error) {
        hideLoader();
        mainLogger.error('Error al cargar películas populares:', error);
        showEmptyMessage('Error al cargar las películas. Intenta de nuevo.');
    }
}

async function loadChristmasMovies() {
    try {
        mainLogger.info('🎄 Cargando películas navideñas...');
        
        currentSection = 'christmas';
        currentEndpoint = 'search/movie?query=christmas';
        sectionTitle.textContent = '🎄 Películas Navideñas';
        sectionTitle.classList.add('christmas-title');
        searchInput.value = '';

        if (activeGenre) {
            activeGenre.classList.remove('active');
        }
        
        const christmasGenreBtn = document.querySelector('.genre-btn.christmas-genre');
        if (christmasGenreBtn) {
            activeGenre = christmasGenreBtn;
            christmasGenreBtn.classList.add('active');
        }

        showLoader();
        const data = await getMovies(currentEndpoint, 1);
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
                displayMovies(christmasMovies);
                currentPage = 1;
                totalPages = data.total_pages;
                loadMoreButton.style.display = totalPages > 1 ? 'block' : 'none';
                mainLogger.success(`✓ ${christmasMovies.length} películas navideñas cargadas`);
            } else {
                displayMovies(data.results);
                currentPage = 1;
                totalPages = data.total_pages;
                loadMoreButton.style.display = totalPages > 1 ? 'block' : 'none';
                mainLogger.success(`✓ ${data.results.length} películas relacionadas cargadas`);
            }
        } else {
            showEmptyMessage('No se encontraron películas navideñas. Intenta más tarde.');
        }
    } catch (error) {
        hideLoader();
        mainLogger.error('Error al cargar películas navideñas:', error);
        showEmptyMessage('Error al cargar las películas navideñas. Intenta de nuevo.');
    }
}

function displayFavorites() {
    mainLogger.info('❤️ Mostrando favoritos...');
    currentSection = 'favorites';
    sectionTitle.textContent = 'Mis favoritos';
    sectionTitle.classList.remove('christmas-title');
    const favorites = getFavorites();
    clearResults();
    loadMoreButton.style.display = 'none';
    
    if (favorites.length === 0) {
        showEmptyMessage('Aún no tienes películas en favoritos');
    } else {
        displayMovies(favorites);
        mainLogger.success(`✓ Mostrando ${favorites.length} favoritos`);
    }
    
    syncNavigationState('favorites');
}

function displayHistory() {
    mainLogger.info('📺 Mostrando historial...');
    currentSection = 'history';
    sectionTitle.textContent = 'Películas vistas';
    sectionTitle.classList.remove('christmas-title');
    const watched = getWatchedMovies();
    clearResults();
    loadMoreButton.style.display = 'none';
    
    if (watched.length === 0) {
        showEmptyMessage('Aún no has marcado ninguna película como vista');
    } else {
        displayMovies(watched);
        mainLogger.success(`✓ Mostrando ${watched.length} películas vistas`);
    }
    
    syncNavigationState('history');
}

// ============================================
// EVENT LISTENERS
// ============================================

// Navegación del sidebar
sidebarNavButtons.forEach(button => {
    button.addEventListener('click', () => {
        const section = button.dataset.section;
        if (section) {
            navigateToSection(section);
        }
    });
});

// Navegación del bottom nav (mobile)
bottomNavButtons.forEach(button => {
    button.addEventListener('click', () => {
        const section = button.dataset.section;
        if (section) {
            navigateToSection(section);
        }
    });
});

// Home button
if (homeButton) {
    homeButton.addEventListener('click', () => {
        mainLogger.info('🏠 Botón Home presionado');
        loadPopularMovies();
        syncNavigationState('popular');
    });
}

// Búsqueda
if (searchInput) {
    const performSearch = async () => {
        const query = searchInput.value.trim();
        
        if (!query) {
            mainLogger.warn('⚠️ Búsqueda vacía ignorada');
            alert('Por favor, ingresa un término de búsqueda');
            return;
        }
        
        try {
            mainLogger.info(`🔍 Búsqueda iniciada: "${query}"`);
            
            currentSection = 'search';
            currentEndpoint = `search/movie?query=${encodeURIComponent(query)}`;
            sectionTitle.textContent = `Resultados: "${query}"`;
            sectionTitle.classList.remove('christmas-title');

            if (activeGenre) {
                activeGenre.classList.remove('active');
                activeGenre = null;
            }

            showLoader();
            const data = await getMovies(currentEndpoint, 1);
            hideLoader();
            
            if (data) {
                clearResults();
                if (data.results && data.results.length > 0) {
                    displayMovies(data.results);
                    currentPage = 1;
                    totalPages = data.total_pages;
                    loadMoreButton.style.display = totalPages > 1 ? 'block' : 'none';
                    mainLogger.success(`✓ ${data.results.length} resultados encontrados`);
                } else {
                    showEmptyMessage(`No se encontraron resultados para "${query}"`);
                }
            }
        } catch (error) {
            hideLoader();
            mainLogger.error('Error en búsqueda:', error);
            showEmptyMessage('Error al buscar. Intenta de nuevo.');
        }
    };
    
    searchInput.addEventListener('keyup', e => {
        if (e.key === 'Enter') {
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
            loadChristmasMovies();
            return;
        }
        
        try {
            const genreName = btn.textContent;
            const genreId = btn.dataset.genreId;
            
            mainLogger.info(`🎭 Filtro de género aplicado: ${genreName}`);
            
            if (activeGenre) activeGenre.classList.remove('active');
            activeGenre = btn;
            btn.classList.add('active');
            
            currentSection = 'genre';
            currentEndpoint = `discover/movie?with_genres=${genreId}`;
            sectionTitle.textContent = genreName;
            sectionTitle.classList.remove('christmas-title');
            searchInput.value = '';
            
            showLoader();
            const data = await getMovies(currentEndpoint, 1);
            hideLoader();
            
            if (data) {
                clearResults();
                displayMovies(data.results);
                currentPage = 1;
                totalPages = data.total_pages;
                loadMoreButton.style.display = totalPages > 1 ? 'block' : 'none';
                mainLogger.success(`✓ ${data.results.length} películas de ${genreName}`);
            }
        } catch (error) {
            hideLoader();
            mainLogger.error('Error al filtrar por género:', error);
        }
    });
}

// Cargar más
if (loadMoreButton) {
    loadMoreButton.addEventListener('click', async () => {
        if (currentPage >= totalPages) return;
        
        try {
            mainLogger.info(`📄 Cargando página ${currentPage + 1}/${totalPages}...`);
            
            showLoader();
            const data = await getMovies(currentEndpoint, currentPage + 1);
            hideLoader();
            
            if (data && data.results) {
                allMoviesCache = [...allMoviesCache, ...data.results];
                const filteredMovies = applyFiltersToMovies(data.results);
                displayMovies(filteredMovies);
                updateResultsCount(applyFiltersToMovies(allMoviesCache).length, allMoviesCache.length);
                
                currentPage = data.page;
                if (currentPage >= data.total_pages) {
                    loadMoreButton.style.display = 'none';
                    mainLogger.info('✓ Todas las páginas cargadas');
                }
            }
        } catch (error) {
            hideLoader();
            mainLogger.error('Error al cargar más películas:', error);
        }
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
            const data = await getMovieDetails(movieId);
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
    favoritesButton.addEventListener('click', displayFavorites);
}

if (mobileFavoritesButton) {
    mobileFavoritesButton.addEventListener('click', displayFavorites);
}

// Historial
if (historyButton) {
    historyButton.addEventListener('click', displayHistory);
}

if (mobileHistoryButton) {
    mobileHistoryButton.addEventListener('click', displayHistory);
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
            const data = await getMovieDetails(currentRecommendedMovie.id);
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
        updateGrid();
    });
}

function closeModal() {
    mainLogger.info('✖️ Cerrando modal');
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
}

const closeModalBtn = document.querySelector('.close-modal');
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
}

if (modal) {
    modal.addEventListener('click', e => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
        closeModal();
    }
});

// ============================================