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
            <img src="${details.poster_path ? imageBaseUrl + details.poster_path : 'https://via.placeholder.com/150x225?text=Sin+Poster'}" alt="${details.title}" class="modal-poster">
            <div>
                <h2>${details.title}</h2>
                <p><strong>Lanzamiento:</strong> ${formatDate(details.release_date)}</p>
                <p><strong>Género(s):</strong> ${genres}</p>
                <p><strong>Puntuación:</strong> ⭐ ${details.vote_average.toFixed(1)} / 10</p>
                <p><strong>Duración:</strong> ${details.runtime || 'N/A'} min</p>
                
                <div class="movie-actions">
                    <button id="favorite-btn" class="${isFav ? 'active-fav' : ''}">
                        ${isFav ? 'Eliminar de Favoritos' : 'Añadir a Favoritos'} ❤️
                    </button>
                    <button id="watched-btn" class="${isWatch ? 'active-watch' : ''}">
                        ${isWatch ? 'Marcar como Pendiente' : 'Marcar como Visto'} ✅
                    </button>
                </div>
            </div>
        </div>
        
        <div class="modal-stats">
            <div><strong>Original:</strong> ${details.original_title}</div>
            <div><strong>Votos:</strong> ${details.vote_count.toLocaleString()}</div>
            <div><strong>Presupuesto:</strong> ${details.budget > 0 ? '$' + details.budget.toLocaleString() : 'N/A'}</div>
            <div><strong>Recaudación:</strong> ${details.revenue > 0 ? '$' + details.revenue.toLocaleString() : 'N/A'}</div>
        </div>
        
        <h3>Sinopsis</h3>
        <p>${details.overview || 'Sin descripción disponible.'}</p>

        ${trailerEmbed ? `
            <h3>Trailer</h3>
            <div class="video-container">
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
        ` : '<h3>Trailer</h3><p>Trailer no disponible.</p>'}
        
        ${providers.length > 0 ? `
            <h3>Disponible para Streaming (CO/ES)</h3>
            <div class="watch-providers">
                ${providers.map(p => `
                    <img src="${imageBaseUrl + p.logo_path}" alt="${p.provider_name}" title="${p.provider_name}" class="provider-logo">
                `).join('')}
            </div>
        ` : '<h3>Disponible para Streaming</h3><p>Información de streaming no disponible.</p>'}

        ${movieKeywords.length > 0 ? `
            <h3>Palabras Clave</h3>
            <div class="keywords">
                ${movieKeywords.map(k => `<span class="keyword-tag">${k.name}</span>`).join(' ')}
            </div>
        ` : ''}

        ${movieReviews.length > 0 ? `
            <h3>Reseñas (${movieReviews.length})</h3>
            <div class="reviews-container">
                ${movieReviews.slice(0, 3).map(r => `
                    <div class="review-card">
                        <h4>${r.author}</h4>
                        <p>${r.content.substring(0, 300)}${r.content.length > 300 ? '...' : ''}</p>
                        <a href="${r.url}" target="_blank" rel="noopener noreferrer">Leer más</a>
                    </div>
                `).join('')}
            </div>
        ` : ''}

        ${similarMovies.length > 0 ? `
        <h3>Películas Similares</h3>
            <div class="similar-movies">
                ${similarMovies.map(m => `
                    <div class="similar-movie" data-movie-id="${m.id}" title="${m.title}">
                        <img src="${m.poster_path ? imageBaseUrl + m.poster_path : ''}" alt="${m.title}">
                        <p>${m.title}</p>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}

    `;

    modal.classList.add('active');
    document.body.classList.add('modal-open'); // 💡 CAMBIO APLICADO: Añade la clase modal-open al body

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