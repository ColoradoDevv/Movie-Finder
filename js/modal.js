import { imageBaseUrl, youtubeBaseUrl } from './config.js';
import { addToFavorites, removeFromFavorites, addToWatched, removeFromWatched, isFavorite, isWatched } from './storage.js';
import { formatDate } from './utils.js';
import { getMovieDetails } from './api.js';
import { modalLogger } from './logger.js';

const modal = document.getElementById('movie-modal');

// Referencias a los elementos de botones actuales
let currentFavoriteBtn = null;
let currentWatchedBtn = null;
let currentFavoriteHandler = null;
let currentWatchedHandler = null;
let currentSimilarHandlers = [];

modalLogger.info('🎭 Módulo de modal inicializado');

export function openModal(details) {
    if (!details || !details.id) {
        modalLogger.error('Datos de película inválidos para el modal');
        return;
    }

    modalLogger.info(`🎬 Abriendo modal para: "${details.title}" (ID: ${details.id})`);
    modalLogger.time('Renderizado del modal');

    // Limpiar event listeners anteriores ANTES de crear el nuevo contenido
    cleanupEventListeners();

    const modalBody = document.getElementById('modal-body');
    
    const trailer = details.videos?.results?.find(v => v.type === 'Trailer') || details.videos?.results?.[0] || null;
    const trailerEmbed = trailer ? `${youtubeBaseUrl}${trailer.key}` : null;

    if (trailer) {
        modalLogger.debug(`🎥 Tráiler encontrado: ${trailer.name || 'Sin nombre'}`);
    } else {
        modalLogger.warn('⚠️ No se encontró tráiler disponible');
    }

    const genres = details.genres?.map(g => g.name).join(', ') || 'Sin género';
    const isFav = isFavorite(details.id);
    const isWatch = isWatched(details.id);

    modalLogger.debug('Estado de la película:', {
        favorito: isFav ? 'SÍ' : 'NO',
        vista: isWatch ? 'SÍ' : 'NO'
    });

    const providers = details['watch/providers']?.results?.CO?.flatrate || details['watch/providers']?.results?.ES?.flatrate || [];
    const movieKeywords = details.keywords?.keywords || [];
    const movieReviews = details.reviews?.results || [];
    const similarMovies = details.similar?.results?.slice(0, 12) || [];

    modalLogger.debug('Contenido adicional:', {
        proveedores: providers.length,
        keywords: movieKeywords.length,
        reseñas: movieReviews.length,
        similares: similarMovies.length
    });

    // Validaciones
    const voteAverage = (details.vote_average && details.vote_average > 0) 
        ? details.vote_average.toFixed(1) 
        : 'N/A';

    const posterUrl = details.poster_path 
        ? imageBaseUrl + details.poster_path 
        : 'https://via.placeholder.com/300x450/1f1f1f/808080?text=Sin+Poster';

    // Iconos SVG
    const heartIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>`;

    const checkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`;

    modalBody.innerHTML = `
        <div class="modal-header">
            <img src="${posterUrl}" alt="${details.title}" class="modal-poster">
            <div>
                <h2 id="modal-title">${details.title || 'Sin título'}</h2>
                <p><strong>Lanzamiento:</strong> ${formatDate(details.release_date)}</p>
                <p><strong>Géneros:</strong> ${genres}</p>
                <p><strong>Puntuación:</strong> ${voteAverage} / 10</p>
                <p><strong>Duración:</strong> ${details.runtime || 'N/A'} min</p>
                
                <div class="movie-actions">
                    <button class="action-btn ${isFav ? 'active' : ''}" data-action="favorite" aria-label="${isFav ? 'Eliminar de favoritos' : 'Añadir a favoritos'}">
                        ${heartIcon}
                        <span>${isFav ? 'En favoritos' : 'Añadir a favoritos'}</span>
                    </button>
                    <button class="action-btn ${isWatch ? 'active' : ''}" data-action="watched" aria-label="${isWatch ? 'Marcar como pendiente' : 'Marcar como vista'}">
                        ${checkIcon}
                        <span>${isWatch ? 'Vista' : 'Marcar como vista'}</span>
                    </button>
                </div>
            </div>
        </div>
        
        <div class="modal-stats">
            <div class="stat-item">
                <span class="stat-value">${details.original_title || details.title}</span>
                <span class="stat-label">Título Original</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${(details.vote_count || 0).toLocaleString()}</span>
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
                <h3>Tráiler</h3>
                <div class="modal-trailer">
                    <iframe 
                        width="100%" 
                        height="315" 
                        src="${trailerEmbed}" 
                        title="Tráiler de ${details.title}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen
                        loading="lazy"
                    ></iframe>
                </div>
            </div>
        ` : '<div class="modal-section"><h3>Tráiler</h3><p>Tráiler no disponible.</p></div>'}
        
        ${providers.length > 0 ? `
            <div class="modal-section">
                <h3>Disponible en streaming</h3>
                <div class="production-companies">
                    ${providers.map(p => `
                        <img src="${imageBaseUrl + p.logo_path}" alt="${p.provider_name}" title="${p.provider_name}" class="company-logo" loading="lazy">
                    `).join('')}
                </div>
            </div>
        ` : '<div class="modal-section"><h3>Disponible en streaming</h3><p>Información de streaming no disponible.</p></div>'}

        ${movieKeywords.length > 0 ? `
            <div class="modal-section">
                <h3>Palabras clave</h3>
                <div class="keywords-list">
                    ${movieKeywords.map(k => `<span class="keyword-tag">${k.name}</span>`).join('')}
                </div>
            </div>
        ` : ''}

        ${movieReviews.length > 0 ? `
            <div class="modal-section">
                <h3>Reseñas de usuarios</h3>
                ${movieReviews.slice(0, 3).map(r => `
                    <div class="review-card">
                        <span class="author">${r.author || 'Anónimo'}</span>
                        <p>${r.content.substring(0, 300)}${r.content.length > 300 ? '...' : ''}</p>
                        ${r.url ? `<a href="${r.url}" target="_blank" rel="noopener noreferrer">Leer reseña completa</a>` : ''}
                    </div>
                `).join('')}
            </div>
        ` : ''}

        ${similarMovies.length > 0 ? `
            <div class="modal-section">
                <h3>Películas similares</h3>
                <div class="similar-movies">
                    ${similarMovies.map(m => `
                        <div class="similar-movie" data-movie-id="${m.id}" title="${m.title}">
                            <img src="${m.poster_path ? imageBaseUrl + m.poster_path : 'https://via.placeholder.com/220x330/1f1f1f/808080?text=Sin+Poster'}" alt="${m.title}" loading="lazy">
                            <p>${m.title}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;

    modal.classList.add('active');
    document.body.classList.add('modal-open');

    modalLogger.timeEnd('Renderizado del modal');
    modalLogger.success(`✓ Modal abierto exitosamente para "${details.title}"`);

    // Ahora sí, agregar los nuevos event listeners
    setupModalEventListeners(details);
}

/**
 * Configura los event listeners del modal
 * @param {Object} details - Detalles de la película
 */
function setupModalEventListeners(details) {
    const modalBody = document.getElementById('modal-body');
    
    // Obtener referencias a los botones
    currentFavoriteBtn = modalBody.querySelector('[data-action="favorite"]');
    currentWatchedBtn = modalBody.querySelector('[data-action="watched"]');

    // Crear handlers
    currentFavoriteHandler = () => {
        modalLogger.info(`${isFavorite(details.id) ? '🗑️ Removiendo' : '❤️ Añadiendo'} "${details.title}" de favoritos`);
        
        if (isFavorite(details.id)) {
            removeFromFavorites(details.id);
        } else {
            addToFavorites(details);
        }
        openModal(details); // Re-abrir para actualizar estado
        modal.dispatchEvent(new CustomEvent('movie-state-changed'));
    };

    currentWatchedHandler = () => {
        modalLogger.info(`${isWatched(details.id) ? '🗑️ Removiendo' : '✅ Marcando'} "${details.title}" como vista`);
        
        if (isWatched(details.id)) {
            removeFromWatched(details.id);
        } else {
            addToWatched(details);
        }
        openModal(details); // Re-abrir para actualizar estado
        modal.dispatchEvent(new CustomEvent('movie-state-changed'));
    };

    // Agregar event listeners
    if (currentFavoriteBtn) {
        currentFavoriteBtn.addEventListener('click', currentFavoriteHandler);
        modalLogger.debug('✓ Listener de favoritos agregado');
    }
    
    if (currentWatchedBtn) {
        currentWatchedBtn.addEventListener('click', currentWatchedHandler);
        modalLogger.debug('✓ Listener de vistas agregado');
    }

    // Películas similares
    const similarElements = modalBody.querySelectorAll('.similar-movie');
    modalLogger.debug(`📎 Adjuntando ${similarElements.length} listeners a películas similares`);
    
    similarElements.forEach(el => {
        const handler = async () => {
            const movieId = el.dataset.movieId;
            if (movieId) {
                modalLogger.info(`🔄 Cargando película similar ID: ${movieId}`);
                try {
                    const data = await getMovieDetails(movieId);
                    if (data) openModal(data);
                } catch (error) {
                    modalLogger.error('Error al cargar película similar:', error);
                }
            }
        };
        el.addEventListener('click', handler);
        currentSimilarHandlers.push({ element: el, handler });
    });
    
    modalLogger.success('✓ Todos los event listeners del modal configurados');
}

/**
 * Limpia todos los event listeners para prevenir memory leaks
 */
function cleanupEventListeners() {
    // Remover listeners de botones de acción
    if (currentFavoriteBtn && currentFavoriteHandler) {
        currentFavoriteBtn.removeEventListener('click', currentFavoriteHandler);
        modalLogger.debug('🧹 Listener de favoritos removido');
    }
    
    if (currentWatchedBtn && currentWatchedHandler) {
        currentWatchedBtn.removeEventListener('click', currentWatchedHandler);
        modalLogger.debug('🧹 Listener de vistas removido');
    }
    
    // Remover listeners de películas similares
    if (currentSimilarHandlers.length > 0) {
        modalLogger.debug(`🧹 Limpiando ${currentSimilarHandlers.length} event listeners de similares`);
        currentSimilarHandlers.forEach(({ element, handler }) => {
            element.removeEventListener('click', handler);
        });
        currentSimilarHandlers = [];
    }
    
    // Resetear referencias
    currentFavoriteBtn = null;
    currentWatchedBtn = null;
    currentFavoriteHandler = null;
    currentWatchedHandler = null;
    
    modalLogger.debug('✓ Limpieza de event listeners completada');
}

/**
 * Cierra el modal
 */
export function closeModal() {
    if (!modal) return;
    
    modalLogger.info('✖️ Cerrando modal');
    
    // Limpiar event listeners antes de cerrar
    cleanupEventListeners();
    
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
    
    modalLogger.success('✓ Modal cerrado correctamente');
}

// Event listener del botón de cerrar
const closeModalBtn = document.querySelector('.close-modal');
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
    modalLogger.debug('✓ Listener del botón cerrar agregado');
}

// Cerrar al hacer clic en el overlay
if (modal) {
    modal.addEventListener('click', e => {
        if (e.target === modal) {
            closeModal();
        }
    });
    modalLogger.debug('✓ Listener del overlay agregado');
}