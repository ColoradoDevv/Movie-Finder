/**
 * MoviesView.js
 * Vista para renderizar grillas de películas
 */

import { MovieCard } from '../components/MovieCard.js';
import { uiLogger } from '../../logger.js';

/**
 * Vista para coordinar el renderizado de múltiples películas
 */
export class MoviesView {
    /**
     * @param {HTMLElement} container - Contenedor donde se renderizarán las películas
     */
    constructor(container) {
        if (!container) {
            throw new Error('MoviesView requiere un contenedor válido');
        }
        this.container = container;
        uiLogger.info('🎬 MoviesView inicializado');
    }

    /**
     * Renderiza una lista de películas
     * @param {Array} movies - Array de objetos de películas
     */
    render(movies) {
        if (!Array.isArray(movies) || movies.length === 0) {
            uiLogger.warn('No hay películas para mostrar');
            return;
        }

        uiLogger.info(`📋 Renderizando ${movies.length} películas...`);
        uiLogger.time('Renderizado de películas');

        const fragment = document.createDocumentFragment();
        let successCount = 0;
        let errorCount = 0;

        movies.forEach(movie => {
            try {
                const movieCard = new MovieCard(movie);
                const card = movieCard.render();
                if (card) {
                    fragment.appendChild(card);
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                uiLogger.error(`Error al crear tarjeta para película ID ${movie?.id}:`, error);
                errorCount++;
            }
        });

        this.container.appendChild(fragment);

        uiLogger.timeEnd('Renderizado de películas');
        uiLogger.success(`✓ ${successCount} tarjetas renderizadas exitosamente`);

        if (errorCount > 0) {
            uiLogger.warn(`⚠️ ${errorCount} tarjetas fallaron al renderizar`);
        }
    }

    /**
     * Agrega películas al contenedor existente (para "cargar más")
     * @param {Array} movies - Array de objetos de películas
     */
    append(movies) {
        if (!Array.isArray(movies) || movies.length === 0) {
            uiLogger.warn('No hay películas para agregar');
            return;
        }

        uiLogger.info(`➕ Agregando ${movies.length} películas más...`);
        this.render(movies);
    }

    /**
     * Limpia el contenedor
     */
    clear() {
        if (this.container) {
            this.container.innerHTML = '';
            uiLogger.debug('🧹 Contenedor de películas limpiado');
        }
    }
}
