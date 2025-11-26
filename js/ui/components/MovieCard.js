/**
 * MovieCard.js
 * Componente para renderizar tarjetas de películas
 */

import { imageBaseUrl } from '../../config.js';
import { StorageService } from '../../services/StorageService.js';
import { formatDate, getPlaceholderImage, handleImageError } from '../../utils.js';
import { uiLogger } from '../../logger.js';

/**
 * Componente para crear tarjetas de películas
 */
export class MovieCard {
    /**
     * @param {Object} movie - Datos de la película
     */
    constructor(movie) {
        if (!movie || !movie.id) {
            uiLogger.error('Datos de película inválidos:', movie);
            throw new Error('MovieCard requiere un objeto movie válido con id');
        }
        this.movie = movie;
        uiLogger.debug(`Creando tarjeta para: "${movie.title}" (ID: ${movie.id})`);
    }

    /**
     * Renderiza la tarjeta de película
     * @returns {HTMLElement} - Elemento DOM de la tarjeta
     */
    render() {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.dataset.movieId = this.movie.id;

        // Iconos SVG para favoritos y vistas
        const favoriteIcon = `<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>`;

        const watchedIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>`;

        const favoriteMark = StorageService.isFavorite(this.movie.id)
            ? `<span class="movie-status" style="color: #e50914;">${favoriteIcon}</span>`
            : '';
        const watchedMark = StorageService.isWatched(this.movie.id)
            ? `<span class="movie-status" style="color: #46d369;">${watchedIcon}</span>`
            : '';

        // Validación de vote_average
        const voteAverage = (this.movie.vote_average && this.movie.vote_average > 0)
            ? this.movie.vote_average.toFixed(1)
            : 'N/A';

        // Validación de imagen - USAR PLACEHOLDER LOCAL
        const posterUrl = this.movie.poster_path
            ? imageBaseUrl + this.movie.poster_path
            : getPlaceholderImage(500, 750, 'Sin Poster');

        // Crear imagen con manejo de errores
        const img = document.createElement('img');
        img.src = posterUrl;
        img.alt = this.movie.title || 'Película sin título';
        img.loading = 'lazy';
        img.onerror = function () { handleImageError(this); };

        card.innerHTML = `
            ${favoriteMark}${watchedMark}
        <div class="movie-info">
            <h3>${this.movie.title || 'Sin título'}</h3>
            <p>${voteAverage} · ${formatDate(this.movie.release_date)}</p>
        </div>
        `;

        // Insertar imagen al principio
        card.insertBefore(img, card.firstChild);

        uiLogger.debug(`✓ Tarjeta creada: "${this.movie.title}"`);
        return card;
    }

    /**
     * Actualiza los datos de la película y re-renderiza
     * @param {Object} movie - Nuevos datos de la película
     */
    update(movie) {
        if (!movie || !movie.id) {
            uiLogger.error('Datos de película inválidos para actualizar:', movie);
            return;
        }
        this.movie = movie;
        uiLogger.debug(`Actualizando tarjeta: "${movie.title}"`);
    }
}
