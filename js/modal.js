import { imageBaseUrl, youtubeBaseUrl } from './config.js';
import { addToFavorites, removeFromFavorites, addToWatched, removeFromWatched, isFavorite, isWatched } from './storage.js';
import { formatDate } from './utils.js';
const modal = document.getElementById('movie-modal');
import { getMovieDetails } from './api.js';

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
            <img src="${details.poster_path ? imageBaseUrl + details.poster_path : 'https://via.placeholder.com/150x225?text=Sin+Poster'}" alt="${details.title}" class="modal-poster">
            <div>
                <h2>${details.title}</h2>
                <p><strong>Lanzamiento:</strong> ${formatDate(details.release_date)}</p>
                <p><strong>Género(s):</strong> ${genres}</p>
                <p><strong>Puntuación:</strong> ⭐ ${details.vote_average.toFixed(1)} / 10</p>
                <p><strong>Duración:</strong> ${details.runtime || 'N/A'} min</p>
                
                <div class="movie-actions">
                    <button class="action-btn ${isFav ? 'active' : ''}" data-action="favorite">
                        ${isFav ? 'Eliminar de Favoritos' : 'Añadir a Favoritos'} ❤️
                    </button>
                    <button class="action-btn ${isWatch ? 'active' : ''}" data-action="watched">
                        ${isWatch ? 'Marcar como Pendiente' : 'Marcar como Visto'} ✅
                    </button>
                </div>
            </div>
        </div>
        
        <div class="modal-stats">
            <div class="stat-item">
                <span class="stat-value">${details.original_title}</span>
                <span class="stat-label">Título Original</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${details.vote_count.toLocaleString()}</span>
                <span class="stat-label">Votos</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${details.budget > 0 ? '$' + (details.budget / 1000000).toFixed(1) + 'M' : 'N/A'}</span>
                <span class="stat-label">Presupuesto</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${details.revenue > 0 ? '$' + (details.revenue / 1000000).toFixed(1) + 'M' : 'N/A'}</span>
                <span class="stat-label">Recaudación</span>
            </div>
        </div>
        
        <div class="modal-section">
            <h3>Sinopsis</h3>
            <p>${details.overview || 'Sin descripción disponible.'}</p>
        </div>

        ${trailerEmbed ? `
            <div class="modal-section">
                <h3>Trailer</h3>
                <div class="modal-trailer">
                    <iframe 
                        width="100%" 
                        height="315" 
                        src="${trailerEmbed}" 
                        title="YouTube video player" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen
                    ></iframe>
                </div>
            </div>
        ` : '<div class="modal-section"><h3>Trailer</h3><p>Trailer no disponible.</p></div>'}
        
        ${providers.length > 0 ? `
            <div class="modal-section">
                <h3>Disponible para Streaming (CO/ES)</h3>
                <div class="production-companies">
                    ${providers.map(p => `
                        <img src="${imageBaseUrl + p.logo_path}" alt="${p.provider_name}" title="${p.provider_name}" class="company-logo">
                    `).join('')}
                </div>
            </div>
        ` : '<div class="modal-section"><h3>Disponible para Streaming</h3><p>Información de streaming no disponible.</p></div>'}

        ${movieKeywords.length > 0 ? `
            <div class="modal-section">
                <h3>Palabras Clave</h3>
                <div class="keywords-list">
                    ${movieKeywords.map(k => `<span class="keyword-tag">${k.name}</span>`).join('')}
                </div>
            </div>
        ` : ''}

        ${movieReviews.length > 0 ? `
            <div class="modal-section">
                <h3>Reseñas (${movieReviews.length})</h3>
                ${movieReviews.slice(0, 3).map(r => `
                    <div class="review-card">
                        <span class="author">${r.author}</span>
                        <p>${r.content.substring(0, 300)}${r.content.length > 300 ? '...' : ''}</p>
                        <a href="${r.url}" target="_blank" rel="noopener noreferrer">Leer más</a>
                    </div>
                `).join('')}
            </div>
        ` : ''}

        ${similarMovies.length > 0 ? `
            <div class="modal-section">
                <h3>Películas Similares</h3>
                <div class="similar-movies">
                    ${similarMovies.map(m => `
                        <div class="similar-movie" data-movie-id="${m.id}" title="${m.title}">
                            <img src="${m.poster_path ? imageBaseUrl + m.poster_path : 'https://via.placeholder.com/150x225?text=Sin+Poster'}" alt="${m.title}">
                            <p>${m.title}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;

    modal.classList.add('active');
    document.body.classList.add('modal-open');

    // Botones favoritos y visto - CORREGIDO
    const favoriteBtn = modalBody.querySelector('[data-action="favorite"]');
    const watchedBtn = modalBody.querySelector('[data-action="watched"]');

    favoriteBtn.addEventListener('click', () => {
        if (isFavorite(details.id)) {
            removeFromFavorites(details.id);
        } else {
            addToFavorites(details);
        }
        openModal(details);
        modal.dispatchEvent(new CustomEvent('movie-state-changed'));
    });

    watchedBtn.addEventListener('click', () => {
        if (isWatched(details.id)) {
            removeFromWatched(details.id);
        } else {
            addToWatched(details);
        }
        openModal(details);
        modal.dispatchEvent(new CustomEvent('movie-state-changed'));
    });

    // Películas similares
    modalBody.querySelectorAll('.similar-movie').forEach(el => {
        el.addEventListener('click', () => {
            getMovieDetails(el.dataset.movieId).then(data => {
                if (data) openModal(data);
            });
        });
    });
}