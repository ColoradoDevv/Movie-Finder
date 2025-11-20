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


// FUNCIÓN PARA REFRESCAR LA LISTA PRINCIPAL
function updateGrid() {
    if (currentSection === 'favorites') {
        displayFavorites();
    } else if (currentSection === 'history') {
        displayHistory();
    } else {
        resultsGrid.querySelectorAll('.movie-card').forEach(card => {
            const movieId = parseInt(card.dataset.movieId);
            const cardIsFavorite = isFavorite(movieId);
            const cardIsWatched = isWatched(movieId);
            
            // Iconos SVG
            const favoriteIcon = `<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>`;
            
            const watchedIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>`;
            
            let statusHtml = '';
            if (cardIsFavorite) statusHtml += `<span class="movie-status" style="color: #e50914;">${favoriteIcon}</span>`;
            if (cardIsWatched) statusHtml += `<span class="movie-status" style="color: #46d369;">${watchedIcon}</span>`;
            
            const existingStatus = card.querySelectorAll('.movie-status');
            existingStatus.forEach(status => status.remove());
            
            if (statusHtml) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = statusHtml;
                while (tempDiv.firstChild) {
                    card.insertBefore(tempDiv.firstChild, card.firstChild);
                }
            }
        });
    }
}


// CARGAR GÉNEROS
async function initGenres() {
    const data = await loadGenres();
    const recommendationSelect = document.getElementById('recommendation-genre');

    if (data && data.genres) {
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
            recommendationSelect.appendChild(option);
        });
    }
}

// CARGAR PELÍCULAS POPULARES
async function loadPopularMovies() {
    currentSection = 'popular';
    currentEndpoint = 'movie/popular';
    sectionTitle.textContent = 'Películas populares';
    activeGenre = null;
    searchInput.value = '';

    if (activeGenre) {
        activeGenre.classList.remove('active');
        activeGenre = null;
    }

    const data = await getMovies(currentEndpoint, 1);
    
    if (data) {
        clearResults();
        displayMovies(data.results);
        currentPage = 1;
        totalPages = data.total_pages;
        loadMoreButton.style.display = totalPages > 1 ? 'block' : 'none';
    }
}


// MOSTRAR FAVORITOS
function displayFavorites() {
    currentSection = 'favorites';
    sectionTitle.textContent = 'Mis favoritos';
    const favorites = getFavorites();
    clearResults();
    loadMoreButton.style.display = 'none';
    if (favorites.length === 0) {
        showEmptyMessage('Aún no tienes películas en favoritos');
    } else {
        displayMovies(favorites);
    }
}

// MOSTRAR HISTORIAL
function displayHistory() {
    currentSection = 'history';
    sectionTitle.textContent = 'Películas vistas';
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

homeButton.addEventListener('click', loadPopularMovies);

searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (!query) return;
    currentSection = 'search';
    currentEndpoint = `search/movie?query=${encodeURIComponent(query)}`;
    sectionTitle.textContent = `Resultados: "${query}"`;

    if (activeGenre) {
        activeGenre.classList.remove('active');
        activeGenre = null;
    }

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

genreNav.addEventListener('click', e => {
    const btn = e.target.closest('.genre-btn');
    if (!btn) return;
    
    if (activeGenre) activeGenre.classList.remove('active');
    activeGenre = btn;
    btn.classList.add('active');
    
    const genreId = btn.dataset.genreId;
    currentSection = 'genre';
    currentEndpoint = `discover/movie?with_genres=${genreId}`;
    sectionTitle.textContent = btn.textContent;
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

loadMoreButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
        getMovies(currentEndpoint, currentPage + 1).then(data => {
            if (data) {
                displayMovies(data.results);
                currentPage = data.page;
                if (currentPage >= data.total_pages) loadMoreButton.style.display = 'none';
            }
        });
    }
});

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

modal.addEventListener('movie-state-changed', updateGrid);

function closeModal() {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
}

document.querySelector('.close-modal').addEventListener('click', closeModal);

modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
});

// Cerrar modal con tecla ESC
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
    }
});

function initApp() {
    initGenres();
    loadPopularMovies();
}

initApp();