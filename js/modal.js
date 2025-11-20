import { imageBaseUrl, youtubeBaseUrl } from './config.js';
import { addToFavorites, removeFromFavorites, addToWatched, removeFromWatched, isFavorite, isWatched } from './storage.js';
import { formatDate } from './utils.js';
// import { modal } from './utils.js';
const modal = document.getElementById('movie-modal');
import { getMovieDetails } from './api.js'; // Importar getMovieDetails para las películas similares

export function openModal(details) {
    const modalBody = document.getElementById('modal-body');
    
    const trailer = details.videos?.results?.find(v => v.type === 'Trailer') || details.videos?.results?.[0] || null;
    const trailerEmbed = trailer ? `${youtubeBaseUrl}${trailer.key}` : null;

    const genres = details.genres?.map(g => g.name).join(', ') || 'Sin género';

    // Obtiene el estado de los botones
    const isFav = isFavorite(details.id);
    const isWatch = isWatched(details.id);

    const providers = details['watch/providers']?.results?.CO?.flatrate || details['watch/providers']?.results?.ES?.flatrate || [];

    const movieKeywords = details.keywords?.keywords || [];

    const movieReviews = details.reviews?.results || [];

    const similarMovies = details.similar?.results?.slice(0, 12) || [];

    modalBody.innerHTML = `
        <div class="modal-header">
            <img src="${details.poster_path ? imageBaseUrl + details.poster_path : ''}" alt="${details.title}" class="modal-poster">
            <div>
                <h2>${details.title} (${formatDate(details.release_date)})</h2>
                <p><strong>Géneros:</strong> ${genres}</p>
                <p><strong>Duración:</strong> ${details.runtime} min</p>
                <p><strong>Puntuación:</strong> ⭐ ${details.vote_average.toFixed(1)} (${details.vote_count} votos)</p>
                <p><strong>Sinopsis:</strong> ${details.overview || 'Sin sinopsis'}</p>
            </div>
        </div>

        <div class="modal-stats">
            <div class="stat-item">
                <span class="stat-value">${details.vote_average.toFixed(1)}</span>
                <span class="stat-label">Puntuación</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${details.vote_count.toLocaleString()}</span>
                <span class="stat-label">Votos</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">$${details.budget.toLocaleString()}</span>
                <span class="stat-label">Presupuesto</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">$${details.revenue.toLocaleString()}</span>
                <span class="stat-label">Recaudación</span>
            </div>
        </div>

        <div class="movie-actions">
            <button id="favorite-btn" data-movie-id="${details.id}" class="action-btn ${isFav ? 'active' : ''}">
                ${isFav ? 'En Favoritos ❤️' : 'Agregar a Favoritos'}
            </button>
            <button id="watched-btn" data-movie-id="${details.id}" class="action-btn ${isWatch ? 'active' : ''}">
                ${isWatch ? '✅ Vista' : '➕ Marcar como Vista'}
            </button>
        </div>

        ${trailerEmbed ? `
        <div class="modal-section">
            <h3>Tráiler</h3>
            <iframe width="100%" height="400" src="${trailerEmbed}" frameborder="0" allowfullscreen></iframe>
        </div>` : ''}

        ${providers.length > 0 ? `
        <div class="modal-section">
            <h3>Dónde verla (streaming)</h3>
            <div class="production-companies">
                ${providers.map(p => `
                    <img src="${imageBaseUrl + p.logo_path}" alt="${p.provider_name}" class="company-logo" title="${p.provider_name}">
                `).join('')}
            </div>
        </div>` : ''}

        ${movieKeywords.length > 0 ? `
        <div class="modal-section">
            <h3>Palabras clave</h3>
            <div class="keywords-list">
                ${movieKeywords.map(k => `<span class="keyword-tag">${k.name}</span>`).join('')}
            </div>
        </div>` : ''}

        ${movieReviews.length > 0 ? `
        <div class="modal-section">
            <h3>Reseñas</h3>
            ${movieReviews.slice(0, 3).map(r => `
                <div class="review-card">
                    <p>${r.content.length > 300 ? r.content.substring(0, 300) + '...' : r.content}</p>
                    <span class="author">- ${r.author}</span>
                </div>
            `).join('')}
        </div>` : ''}

        ${similarMovies.length > 0 ? `
        <div class="modal-section">
            <h3>Películas similares</h3>
            <div class="similar-movies">
                ${similarMovies.map(m => `
                    <div class="similar-movie" data-movie-id="${m.id}">
                        <img src="${m.poster_path ? imageBaseUrl + m.poster_path : ''}" alt="${m.title}">
                        <p>${m.title}</p>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}

    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // opcional: evita scroll del fondo

    // Botones favoritos y visto
    modalBody.querySelector('#favorite-btn').addEventListener('click', () => {
        if (isFavorite(details.id)) {
            removeFromFavorites(details.id);
        } else {
            addToFavorites(details);
        }
        openModal(details); // refresh modal para actualizar botones
        modal.dispatchEvent(new CustomEvent('movie-state-changed')); // NOTIFICA a main.js
    });

    modalBody.querySelector('#watched-btn').addEventListener('click', () => {
        if (isWatched(details.id)) {
            removeFromWatched(details.id);
        } else {
            addToWatched(details);
        }
        openModal(details); // refresh modal para actualizar botones
        modal.dispatchEvent(new CustomEvent('movie-state-changed')); // NOTIFICA a main.js
    });

    // Películas similares
    modalBody.querySelectorAll('.similar-movie').forEach(el => {
        el.addEventListener('click', () => {
            // Se debe importar getMovieDetails en modal.js
            getMovieDetails(el.dataset.movieId).then(data => {
                if (data) openModal(data);
            });
        });
    });
}