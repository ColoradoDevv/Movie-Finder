import { loadGenres, getMovies, getMovieDetails } from './api.js';
import { displayMovies, displayRecommendedMovie } from './ui.js';
import { openModal } from './modal.js';
import { getRandomMovie, currentRecommendedMovie } from './recommendations.js';
import { getFavorites, getWatchedMovies, isFavorite, isWatched } from './storage.js';
import { showLoader, hideLoader, clearResults, showEmptyMessage, sectionTitle, resultsGrid, modal } from './utils.js';


let currentPage = 1;
let totalPages = 1;
let currentEndpoint = 'movie/popular';
let activeGenre = null;
let currentSection = 'popular';

const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const genreNav = document.getElementById('genre-nav');
const homeButton = document.getElementById('home-button');
const loadMoreButton = document.getElementById('load-more');
const favoritesButton = document.getElementById('favorites-button');
const historyButton = document.getElementById('history-button');
const viewRecommendedDetails = document.getElementById('view-recommended-details');
const recommendButton = document.getElementById('recommend-button'); 



// FUNCIÓN PARA REFRESCAR LA LISTA PRINCIPAL (Mantiene los estados de Favoritos/Vistos)
function updateGrid() {
    // Refresca completamente si estamos en las secciones que dependen del localStorage
    if (currentSection === 'favorites') {
        displayFavorites();
    } else if (currentSection === 'history') {
        displayHistory();
    } else {
        // En otras secciones, solo actualiza las marcas de estado de las tarjetas visibles
        resultsGrid.querySelectorAll('.movie-card').forEach(card => {
            const movieId = parseInt(card.dataset.movieId);
            const cardIsFavorite = isFavorite(movieId);
            const cardIsWatched = isWatched(movieId);
            
            // Lógica para actualizar los iconos sin recargar toda la grilla
            let statusHtml = '';
            if (cardIsFavorite) statusHtml += '<span class="movie-status">❤️</span>';
            if (cardIsWatched) statusHtml += '<span class="movie-status">✅</span>';
            
            // Remueve y re-inserta el marcador (si existe)
            const existingStatus = card.querySelector('.movie-status');
            if (existingStatus) existingStatus.remove();
            
            if (statusHtml) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = statusHtml;
                card.insertBefore(tempDiv.firstChild, card.firstChild);
            }
        });
    }
}


// CARGAR GÉNEROS (Carga en navegación y selector de recomendaciones)
async function initGenres() {
    const data = await loadGenres();
    const recommendationSelect = document.getElementById('recommendation-genre');

    if (data && data.genres) {
        data.genres.forEach(genre => {
            // 1. Botones de navegación de género
            const btn = document.createElement('button');
            btn.className = 'genre-btn';
            btn.textContent = genre.name;
            btn.dataset.genreId = genre.id;
            genreNav.appendChild(btn);
            
            // 2. Opciones del selector de recomendaciones
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            recommendationSelect.appendChild(option);
        });
    }
}

// FUNCIÓN PARA CARGAR PELÍCULAS POPULARES (Lógica de inicio y botón Home)
async function loadPopularMovies() {
    currentSection = 'popular';
    currentEndpoint = 'movie/popular';
    sectionTitle.textContent = 'Películas Populares';
    activeGenre = null;
    searchInput.value = '';

    const data = await getMovies(currentEndpoint, 1);
    
    if (data) {
        clearResults(); // Limpia antes de mostrar
        displayMovies(data.results);
        currentPage = 1; // La página actual es la 1
        totalPages = data.total_pages;
        loadMoreButton.style.display = totalPages > 1 ? 'block' : 'none';
    }
}


// MOSTRAR FAVORITOS
function displayFavorites() {
    currentSection = 'favorites';
    sectionTitle.textContent = 'Mis Favoritos ❤️';
    const favorites = getFavorites();
    clearResults();
    loadMoreButton.style.display = 'none';
    if (favorites.length === 0) {
        showEmptyMessage('No tienes películas en favoritos aún');
    } else {
        displayMovies(favorites);
    }
}

// MOSTRAR HISTORIAL
function displayHistory() {
    currentSection = 'history';
    sectionTitle.textContent = 'Películas Vistas 📺';
    const watched = getWatchedMovies();
    clearResults();
    loadMoreButton.style.display = 'none';
    if (watched.length === 0) {
        showEmptyMessage('Aún no has marcado ninguna película como vista');
    } else {
        displayMovies(watched);
    }
}


// EVENT LISTENERS

// Botón Home (Ahora llama a la función de carga)
homeButton.addEventListener('click', loadPopularMovies);

// Búsqueda
searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (!query) return;
    currentSection = 'search';
    currentEndpoint = `search/movie?query=${encodeURIComponent(query)}`;
    sectionTitle.textContent = `Resultados para: "${query}"`;

    getMovies(currentEndpoint, 1).then(data => {
        if (data) {
            clearResults();
            displayMovies(data.results);
            currentPage = 1;
            totalPages = data.total_pages;
            loadMoreButton.style.display = totalPages > 1 ? 'block' : 'none';
        }
    });
});

searchInput.addEventListener('keyup', e => {
    if (e.key === 'Enter') searchButton.click();
});

// Carga de Géneros
genreNav.addEventListener('click', e => {
    const btn = e.target.closest('.genre-btn');
    if (!btn) return;
    
    if (activeGenre) activeGenre.classList.remove('active');
    activeGenre = btn;
    btn.classList.add('active');
    
    const genreId = btn.dataset.genreId;
    currentSection = 'genre';
    currentEndpoint = `discover/movie?with_genres=${genreId}`;
    sectionTitle.textContent = `Películas de ${btn.textContent}`;
    searchInput.value = '';
    
    getMovies(currentEndpoint, 1).then(data => {
        if (data) {
            clearResults();
            displayMovies(data.results);
            currentPage = 1;
            totalPages = data.total_pages;
            loadMoreButton.style.display = totalPages > 1 ? 'block' : 'none';
        }
    });
});

// Cargar Más
loadMoreButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
        getMovies(currentEndpoint, currentPage + 1).then(data => {
            if (data) {
                displayMovies(data.results);
                currentPage = data.page; // Incrementa la página actual después de la carga exitosa
                if (currentPage >= data.total_pages) loadMoreButton.style.display = 'none';
            }
        });
    }
});

// Abrir Modal al hacer click en tarjeta de película
resultsGrid.addEventListener('click', e => {
    const card = e.target.closest('.movie-card');
    if (!card) return;
    const movieId = card.dataset.movieId;
    getMovieDetails(movieId).then(data => {
        if (data) openModal(data);
    });
});

favoritesButton.addEventListener('click', displayFavorites);
historyButton.addEventListener('click', displayHistory);

recommendButton.addEventListener('click', getRandomMovie);

viewRecommendedDetails.addEventListener('click', () => {
    if (currentRecommendedMovie) {
        getMovieDetails(currentRecommendedMovie.id).then(data => {
            if (data) openModal(data);
        });
    }
});

// ESCUCHA EVENTOS PERSONALIZADOS DEL MODAL PARA RECARGAR LA LISTA (si aplica)
// Nota: La función updateGrid debe estar definida antes de este listener.
modal.addEventListener('movie-state-changed', updateGrid);


// FUNCIÓN AUXILIAR PARA CERRAR EL MODAL
function closeModal() {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open'); // 💡 CAMBIO APLICADO: Habilita el scroll
}


// CERRAR MODAL
document.querySelector('.close-modal').addEventListener('click', closeModal);

modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
});


// FUNCIÓN DE INICIO PRINCIPAL (La solución al problema de carga inicial)
function initApp() {
    initGenres();
    loadPopularMovies(); // Carga las películas populares al cargar la página.
}

// INICIO
initApp();