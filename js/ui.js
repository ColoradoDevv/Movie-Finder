import { imageBaseUrl } from './config.js';
import { isFavorite, isWatched } from './storage.js';
import { formatDate, resultsGrid } from './utils.js';

export function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.dataset.movieId = movie.id;

    // Iconos SVG para favoritos y vistas
    const favoriteIcon = `<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>`;
    
    const watchedIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`;

    const favoriteMark = isFavorite(movie.id) ? `<span class="movie-status" style="color: #e50914;">${favoriteIcon}</span>` : '';
    const watchedMark = isWatched(movie.id) ? `<span class="movie-status" style="color: #46d369;">${watchedIcon}</span>` : '';
    const voteAverage = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

    card.innerHTML = `
        ${favoriteMark}${watchedMark}
        <img src="${movie.poster_path ? imageBaseUrl + movie.poster_path : 'https://via.placeholder.com/500x750?text=Sin+Poster'}" alt="${movie.title}">
        <div class="movie-info">
            <h3>${movie.title}</h3>
            <p>${voteAverage} · ${formatDate(movie.release_date)}</p>
        </div>
    `;
    return card;
}

export function displayMovies(movies) {
    const fragment = document.createDocumentFragment();
    movies.forEach(movie => fragment.appendChild(createMovieCard(movie)));
    resultsGrid.appendChild(fragment);
}

export function displayRecommendedMovie(movie) {
    document.getElementById('recommended-poster').src = movie.poster_path ? imageBaseUrl + movie.poster_path : '';
    document.getElementById('recommended-poster').alt = movie.title;
    document.getElementById('recommended-title').textContent = movie.title;
    document.getElementById('recommended-overview').textContent = movie.overview || 'Sin descripción disponible';
    document.getElementById('recommended-rating').textContent = movie.vote_average.toFixed(1);
    document.getElementById('recommended-year').textContent = formatDate(movie.release_date);
    document.getElementById('recommended-movie').classList.add('show');
}