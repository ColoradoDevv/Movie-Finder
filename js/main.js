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
const christmasMoviesButton = document.getElementById('christmas-movies-button');

mainLogger.info('🚀 MovieFinder iniciando...');
mainLogger.group('Estado inicial de la aplicación');
mainLogger.info(`Sección actual: ${currentSection}`);
mainLogger.info(`Endpoint actual: ${currentEndpoint}`);
mainLogger.info(`Página actual: ${currentPage}/${totalPages}`);
mainLogger.groupEnd();

// FUNCIÓN PARA CREAR EFECTO DE NIEVE
function createSnowflakes() {
    const snowflakesContainer = document.querySelector('.snowflakes');
    const numberOfSnowflakes = 50;
    
    for (let i = 0; i < numberOfSnowflakes; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.innerHTML = '❄';
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's';
        snowflake.style.animationDelay = Math.random() * 5 + 's';
        snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
        snowflake.style.opacity = Math.random() * 0.6 + 0.2;
        snowflakesContainer.appendChild(snowflake);
    }
    
    mainLogger.info('❄️ Efecto de nieve navideña creado');
}

// FUNCIÓN OPTIMIZADA PARA REFRESCAR LA LISTA
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
            displayMovies(data.results);
            currentPage = 1;
            totalPages = data.total_pages;
            loadMoreButton.style.display = totalPages > 1 ? 'block' : 'none';
            
            mainLogger.success(`✓ Películas populares cargadas (Página 1/${totalPages})`);
        } else {
            showEmptyMessage('No se pudieron cargar las películas populares');
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
        // Keywords de navidad: 9951 (christmas), 207376 (holiday)
        currentEndpoint = 'discover/movie?with_keywords=9951,207376&sort_by=popularity.desc';
        sectionTitle.textContent = '🎄 Películas Navideñas 🎅';
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
            clearResults();
            displayMovies(data.results);
            currentPage = 1;
            totalPages = data.total_pages;
            loadMoreButton.style.display = totalPages > 1 ? 'block' : 'none';
            
            mainLogger.success(`✓ ${data.results.length} películas navideñas cargadas`);
        } else {
            showEmptyMessage('No se encontraron películas navideñas');
            mainLogger.warn('✗ Sin resultados de películas navideñas');
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

// Botón de películas navideñas (en la sección destacada)
christmasMoviesButton.addEventListener('click', () => {
    mainLogger.info('🎄 Botón de películas navideñas presionado');
    loadChristmasMovies();
    // Scroll suave hacia el grid de resultados
    document.getElementById('section-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            displayMovies(data.results);
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
        mainLogger.info('Paso 1: Creando efecto de nieve...');
        createSnowflakes();
        
        mainLogger.info('Paso 2: Cargando géneros...');
        await initGenres();
        
        mainLogger.info('Paso 3: Cargando películas populares...');
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