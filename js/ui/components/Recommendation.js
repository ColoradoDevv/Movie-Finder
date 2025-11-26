/**
 * Recommendation.js
 * Componente para mostrar recomendaciones de películas
 */

import { imageBaseUrl } from '../../config.js';
import { formatDate, getPlaceholderImage, handleImageError } from '../../utils.js';
import { uiLogger } from '../../logger.js';

/**
 * Componente para renderizar tarjeta de recomendación
 */
export class Recommendation {
    /**
     * @param {HTMLElement} container - Contenedor de la recomendación
     */
    constructor(container) {
        if (!container) {
            throw new Error('Recommendation requiere un contenedor válido');
        }
        this.container = container;
        uiLogger.debug('🎲 Recommendation component inicializado');
    }

    /**
     * Renderiza una película recomendada
     * @param {Object} movie - Datos de la película
     */
    render(movie) {
        if (!movie) {
            uiLogger.error('No se puede mostrar recomendación: película inválida');
            return;
        }

        uiLogger.info(`🎲 Mostrando recomendación: "${movie.title}"`);

        // Usar placeholder local
        const posterUrl = movie.poster_path
            ? imageBaseUrl + movie.poster_path
            : getPlaceholderImage(300, 450, 'Sin Poster');

        const voteAverage = (movie.vote_average && movie.vote_average > 0)
            ? movie.vote_average.toFixed(1)
            : 'N/A';

        try {
            const posterImg = document.getElementById('recommended-poster');
            if (posterImg) {
                posterImg.src = posterUrl;
                posterImg.alt = movie.title || 'Película recomendada';
                posterImg.onerror = function () { handleImageError(this); };
            }

            const titleEl = document.getElementById('recommended-title');
            if (titleEl) titleEl.textContent = movie.title || 'Sin título';

            const overviewEl = document.getElementById('recommended-overview');
            if (overviewEl) overviewEl.textContent = movie.overview || 'Sin descripción disponible';

            const ratingEl = document.getElementById('recommended-rating');
            if (ratingEl) ratingEl.textContent = voteAverage;

            const yearEl = document.getElementById('recommended-year');
            if (yearEl) yearEl.textContent = formatDate(movie.release_date);

            this.show();

            uiLogger.success(`✓ Recomendación mostrada: "${movie.title}" (${voteAverage} / 10)`);
        } catch (error) {
            uiLogger.error('Error al mostrar recomendación:', error);
        }
    }

    /**
     * Muestra el contenedor de recomendación
     */
    show() {
        const recommendedMovie = document.getElementById('recommended-movie');
        if (recommendedMovie) {
            recommendedMovie.classList.add('show');
            uiLogger.debug('✓ Contenedor de recomendación mostrado');
        }
    }

    /**
     * Oculta el contenedor de recomendación
     */
    hide() {
        const recommendedMovie = document.getElementById('recommended-movie');
        if (recommendedMovie) {
            recommendedMovie.classList.remove('show');
            uiLogger.debug('✓ Contenedor de recomendación ocultado');
        }
    }
}
