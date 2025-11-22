import { loadGenres, getMovies, getMovieDetails } from './api.js';
import { displayMovies, displayRecommendedMovie } from './ui.js';
import { openModal } from './modal.js';
import { getRandomMovie, currentRecommendedMovie, resetRecommendationHistory } from './recommendations.js';
import { getFavorites, getWatchedMovies, isFavorite, isWatched } from './storage.js';
import { showLoader, hideLoader, clearResults, showEmptyMessage, sectionTitle, resultsGrid, modal } from './utils.js';
import { mainLogger } from './logger.js';

// Estado de la aplicación
let currentPage = 1;
let totalPages = 1;
let currentEndpoint = 'movie/popular';
let activeGenre = null;
let currentSection = 'popular';
let allMoviesCache = []; // Cache para almacenar todas las películas cargadas
let currentFilters = {
    sortBy: 'default',
    year: '',
    rating: ''
};

// Referencias a elementos del DOM
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const genreNav = document.getElementById('genre-nav');
const homeButton = document.getElementById('home-button');
const loadMoreButton = document.getElementById('load-more');
const favoritesButton = document.getElementById('favorites-button');
const historyButton = document.getElementById('history-button');
const viewRecommendedDetails = document.getElementById('view-recommended-details');
const recommendButton = document.getElementById('recommend-button');
const recommendationGenreSelect = document.getElementById('recommendation-genre');

// Referencias a elementos de filtros
const toggleFiltersBtn = document.getElementById('toggle-filters');
const filtersSection = document.querySelector('.filters-section');
const sortBySelect = document.getElementById('sort-by');
const filterYearSelect = document.getElementById('filter-year');
const filterRatingSelect = document.getElementById('filter-rating');
const applyFiltersBtn = document.getElementById('apply-filters');
const resetFiltersBtn = document.getElementById('reset-filters');
const resultsCount = document.getElementById('results-count');

mainLogger.info('🚀 MovieFinder iniciando...');
mainLogger.group('Estado inicial de la aplicación');
mainLogger.info(`Sección actual: ${currentSection}`);
mainLogger.info(`Endpoint actual: ${currentEndpoint}`);
mainLogger.info(`Página actual: ${currentPage}/${totalPages}`);
mainLogger.groupEnd();

// FUNCIÓN PARA APLICAR FILTROS Y ORDENAMIENTO
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
        case 'title-desc':
            filteredMovies.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
            break;
        case 'rating-desc':
            filteredMovies.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
            break;
        case 'rating-asc':
            filteredMovies.sort((a, b) => (a.vote_average || 0) - (b.vote_average || 0));
            break;
        case 'date-desc':
            filteredMovies.sort((a, b) => {
                const dateA = new Date(a.release_date || '1900-01-01');
                const dateB = new Date(b.release_date || '1900-01-01');
                return dateB - dateA;
            });
            break;
        case 'date-asc':
            filteredMovies.sort((a, b) => {
                const dateA = new Date(a.release_date || '1900-01-01');
                const dateB = new Date(b.release_date || '1900-01-01');
                return dateA - dateB;
            });
            break;
        case 'popularity-desc':
            filteredMovies.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
            break;
        default:
            // Mantener orden original
            break;
    }

    return filteredMovies;
}

// FUNCIÓN PARA ACTUALIZAR CONTADOR DE RESULTADOS
function updateResultsCount(count, total) {
    if (resultsCount) {
        if (count === total) {
            resultsCount.textContent = `Mostrando ${count} ${count === 1 ? 'película' : 'películas'}`;
        } else {
            resultsCount.textContent = `Mostrando ${count} de ${total} ${total === 1 ? 'película' : 'películas'}`;
        }
    }
}

// EVENT LISTENERS PARA FILTROS

toggleFiltersBtn.addEventListener('click', () => {
    filtersSection.classList.toggle('collapsed');
    mainLogger.info(`Panel de filtros ${filtersSection.classList.contains('collapsed') ? 'cerrado' : 'abierto'}`);
});

applyFiltersBtn.addEventListener('click', () => {
    mainLogger.info('🔍 Aplicando filtros...');
    
    currentFilters.sortBy = sortBySelect.value;
    currentFilters.year = filterYearSelect.value;
    currentFilters.rating = filterRatingSelect.value;
    
    mainLogger.debug('Filtros aplicados:', currentFilters);

    // Aplicar filtros a las películas en caché
    if (allMoviesCache.length > 0) {
        const filteredMovies = applyFiltersToMovies(allMoviesCache);
        clearResults();
        displayMovies(filteredMovies);
        updateResultsCount(filteredMovies.length, allMoviesCache.length);
        mainLogger.success(`✓ Filtros aplicados: ${filteredMovies.length} resultados`);
    }
});

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

    // Restaurar películas originales
    if (allMoviesCache.length > 0) {
        clearResults();
        displayMovies(allMoviesCache);
        updateResultsCount(allMoviesCache.length, allMoviesCache.length);
    }
    
    mainLogger.success('✓ Filtros reseteados');
});

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
}

// CARGAR GÉNEROS CON DESTAQUE NAVIDEÑO
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

// CARGAR PELÍCULAS POPULARES
async function loadPopularMovies() {
    try {
        mainLogger.info('⭐ Cargando películas populares...');
        
        currentSection = 'popular';
        currentEndpoint = 'movie/popular';
        sectionTitle.textContent = 'Películas populares';
        sectionTitle.classList.remove('christmas-title');
        searchInput.value = '';
        allMoviesCache = []; // Limpiar caché

        if (activeGenre) {
            activeGenre.classList.remove('active');
            activeGenre = null;
            mainLogger.debug('Género activo removido');
        }

        showLoader();
        const data = await getMovies(currentEndpoint, 1);
        hideLoader();
        
        if (data && data.results) {
            clearResults();
            allMoviesCache = [...data.results]; // Guardar en caché
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
            mainLogger.error('✗ Error al cargar películas populares');
        }
    } catch (error) {
        hideLoader();
        mainLogger.error('Error al cargar películas populares:', error);
        showEmptyMessage('Error al cargar las películas. Intenta de nuevo.');
    }
}

// CARGAR PELÍCULAS NAVIDEÑAS
async function loadChristmasMovies() {
    try {
        mainLogger.info('🎄 Cargando películas navideñas...');
        
        currentSection = 'christmas';
        // Búsqueda directa por término "christmas" que es más efectiva
        currentEndpoint = 'search/movie?query=christmas';
        sectionTitle.textContent = '🎄 Películas Navideñas';
        sectionTitle.classList.add('christmas-title');
        searchInput.value = '';

        if (activeGenre) {
            activeGenre.classList.remove('active');
        }
        
        // Activar el botón de navidad
        const christmasGenreBtn = document.querySelector('.genre-btn.christmas-genre');
        if (christmasGenreBtn) {
            activeGenre = christmasGenreBtn;
            christmasGenreBtn.classList.add('active');
        }

        showLoader();
        const data = await getMovies(currentEndpoint, 1);
        hideLoader();
        
        if (data && data.results && data.results.length > 0) {
            // Filtrar películas que realmente tengan "christmas", "navidad", "santa" en el título
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
                mainLogger.success(`✓ ${christmasMovies.length} películas navideñas reales cargadas`);
            } else {
                // Si el filtro es muy estricto, mostrar todas
                displayMovies(data.results);
                currentPage = 1;
                totalPages = data.total_pages;
                loadMoreButton.style.display = totalPages > 1 ? 'block' : 'none';
                mainLogger.success(`✓ ${data.results.length} películas relacionadas con navidad cargadas`);
            }
        } else {
            // Búsqueda alternativa con múltiples términos navideños
            mainLogger.warn('⚠️ Intentando búsquedas alternativas de películas navideñas...');
            
            const searchTerms = ['santa claus', 'navidad', 'noel', 'christmas carol', 'holiday'];
            let allChristmasMovies = [];
            const seenIds = new Set();
            
            for (const term of searchTerms) {
                const altData = await getMovies(`search/movie?query=${encodeURIComponent(term)}`, 1);
                if (altData && altData.results) {
                    altData.results.forEach(movie => {
                        if (!seenIds.has(movie.id)) {
                            seenIds.add(movie.id);
                            allChristmasMovies.push(movie);
                        }
                    });
                }
            }
            
            if (allChristmasMovies.length > 0) {
                // Ordenar por popularidad
                allChristmasMovies.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
                clearResults();
                displayMovies(allChristmasMovies.slice(0, 20));
                currentPage = 1;
                totalPages = 1;
                loadMoreButton.style.display = 'none';
                mainLogger.success(`✓ ${allChristmasMovies.length} películas navideñas encontradas (búsqueda combinada)`);
            } else {
                showEmptyMessage('No se encontraron películas navideñas. Intenta más tarde.');
                mainLogger.error('✗ Sin resultados de películas navideñas');
            }
        }
    } catch (error) {
        hideLoader();
        mainLogger.error('Error al cargar películas navideñas:', error);
        showEmptyMessage('Error al cargar las películas navideñas. Intenta de nuevo.');
    }
}

// MOSTRAR FAVORITOS
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
        mainLogger.warn('Lista de favoritos vacía');
    } else {
        displayMovies(favorites);
        mainLogger.success(`✓ Mostrando ${favorites.length} favoritos`);
    }
}

// MOSTRAR HISTORIAL
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
        mainLogger.warn('Historial de vistas vacío');
    } else {
        displayMovies(watched);
        mainLogger.success(`✓ Mostrando ${watched.length} películas vistas`);
    }
}

// EVENT LISTENERS

homeButton.addEventListener('click', () => {
    mainLogger.info('🏠 Botón Home presionado');
    loadPopularMovies();
});

searchButton.addEventListener('click', async () => {
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
                mainLogger.success(`✓ ${data.results.length} resultados encontrados para "${query}"`);
            } else {
                showEmptyMessage(`No se encontraron resultados para "${query}"`);
                mainLogger.warn(`Sin resultados para: "${query}"`);
            }
        }
    } catch (error) {
        hideLoader();
        mainLogger.error('Error en búsqueda:', error);
        showEmptyMessage('Error al buscar. Intenta de nuevo.');
    }
});

searchInput.addEventListener('keyup', e => {
    if (e.key === 'Enter') {
        mainLogger.debug('Enter presionado en búsqueda');
        searchButton.click();
    }
});

genreNav.addEventListener('click', async e => {
    const btn = e.target.closest('.genre-btn');
    if (!btn) return;
    
    // Si es el botón de navidad, llamar a la función especial
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
            mainLogger.success(`✓ ${data.results.length} películas de ${genreName} cargadas`);
        }
    } catch (error) {
        hideLoader();
        mainLogger.error('Error al filtrar por género:', error);
    }
});

loadMoreButton.addEventListener('click', async () => {
    if (currentPage >= totalPages) {
        mainLogger.warn('⚠️ Ya se cargaron todas las páginas');
        return;
    }
    
    try {
        mainLogger.info(`📄 Cargando página ${currentPage + 1}/${totalPages}...`);
        
        showLoader();
        const data = await getMovies(currentEndpoint, currentPage + 1);
        hideLoader();
        
        if (data && data.results) {
            // Agregar nuevas películas al caché
            allMoviesCache = [...allMoviesCache, ...data.results];
            
            // Aplicar filtros a las nuevas películas
            const filteredMovies = applyFiltersToMovies(data.results);
            displayMovies(filteredMovies);
            updateResultsCount(applyFiltersToMovies(allMoviesCache).length, allMoviesCache.length);
            
            currentPage = data.page;
            if (currentPage >= data.total_pages) {
                loadMoreButton.style.display = 'none';
                mainLogger.info('✓ Todas las páginas cargadas');
            } else {
                mainLogger.success(`✓ Página ${currentPage}/${totalPages} cargada`);
            }
        }
    } catch (error) {
        hideLoader();
        mainLogger.error('Error al cargar más películas:', error);
    }
});

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
            mainLogger.error(`✗ Error al cargar detalles de ID: ${movieId}`);
        }
    } catch (error) {
        hideLoader();
        mainLogger.error('Error al cargar detalles:', error);
        alert('Error al cargar los detalles de la película');
    }
});

favoritesButton.addEventListener('click', () => {
    mainLogger.info('❤️ Botón Favoritos presionado');
    displayFavorites();
});

historyButton.addEventListener('click', () => {
    mainLogger.info('📺 Botón Historial presionado');
    displayHistory();
});

recommendButton.addEventListener('click', () => {
    mainLogger.info('🎲 Botón Recomendar presionado');
    getRandomMovie();
});

recommendationGenreSelect.addEventListener('change', (e) => {
    const selectedGenre = e.target.selectedOptions[0].text;
    mainLogger.info(`🔄 Género de recomendación cambiado a: ${selectedGenre}`);
    resetRecommendationHistory();
});

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

modal.addEventListener('movie-state-changed', () => {
    mainLogger.debug('🔔 Evento movie-state-changed recibido');
    updateGrid();
});

function closeModal() {
    mainLogger.info('✖️ Cerrando modal');
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
}

document.querySelector('.close-modal').addEventListener('click', () => {
    mainLogger.debug('Botón cerrar modal presionado');
    closeModal();
});

modal.addEventListener('click', e => {
    if (e.target === modal) {
        mainLogger.debug('Click fuera del modal detectado');
        closeModal();
    }
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        mainLogger.debug('Tecla ESC presionada');
        closeModal();
    }
});

// INICIALIZACIÓN
async function initApp() {
    mainLogger.group('🚀 Inicialización de MovieFinder');
    mainLogger.time('Tiempo total de inicialización');
    
    try {
        mainLogger.info('Paso 1: Cargando géneros...');
        await initGenres();
        
        mainLogger.info('Paso 2: Cargando películas populares...');
        await loadPopularMovies();
        
        mainLogger.timeEnd('Tiempo total de inicialización');
        mainLogger.success('✅ MovieFinder inicializado correctamente');
        mainLogger.groupEnd();
        
        // Resumen final
        mainLogger.group('📊 Estado final de la aplicación');
        mainLogger.info(`Sección: ${currentSection}`);
        mainLogger.info(`Total páginas: ${totalPages}`);
        mainLogger.info(`Favoritos: ${getFavorites().length}`);
        mainLogger.info(`Vistas: ${getWatchedMovies().length}`);
        mainLogger.groupEnd();
        
    } catch (error) {
        mainLogger.timeEnd('Tiempo total de inicialización');
        mainLogger.error('❌ Error crítico al inicializar la aplicación:', error);
        mainLogger.groupEnd();
        showEmptyMessage('Error al cargar la aplicación. Recarga la página.');
    }
}

mainLogger.info('⏳ Iniciando aplicación...');
initApp();