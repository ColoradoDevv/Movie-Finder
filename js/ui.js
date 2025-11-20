import { imageBaseUrl } from './config.js';
import { isFavorite, isWatched } from './storage.js';
import { formatDate, resultsGrid } from './utils.js';

export function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.dataset.movieId = movie.id;

    const favoriteMark = isFavorite(movie.id) ? '<span class="movie-status">❤️</span>' : '';
    const watchedMark = isWatched(movie.id) ? '<span class="movie-status">✅</span>' : '';
    const voteAverage = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'

    card.innerHTML = `
        ${favoriteMark}${watchedMark}
        <img src="${movie.poster_path ? imageBaseUrl + movie.poster_path : 'https://via.placeholder.com/500x750?text=Sin+Poster'}" alt="${movie.title}">
        <div class="movie-info">
            <h3>${movie.title}</h3>
            <p>⭐ ${voteAverage} | ${formatDate(movie.release_date)}</p>
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
    document.getElementById('recommended-title').textContent = movie.title;
    document.getElementById('recommended-overview').textContent = movie.overview || 'Sin descripción';
    document.getElementById('recommended-rating').textContent = `⭐ ${movie.vote_average.toFixed(1)}`;
    document.getElementById('recommended-year').textContent = formatDate(movie.release_date);
    document.getElementById('recommended-movie').classList.add('show');
}