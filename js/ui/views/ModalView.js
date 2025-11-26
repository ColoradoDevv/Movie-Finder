/**
 * ModalView.js
 * Vista coordinadora para el modal de detalles de películas
 */

import { Modal } from '../components/Modal.js';
import { TMDBService } from '../../services/TMDBService.js';
import { modalLogger } from '../../logger.js';

/**
 * Vista que coordina el componente Modal
 */
export class ModalView {
    /**
     * Inicializa la vista del modal
     */
    constructor() {
        const modalElement = document.getElementById('movie-modal');
        if (!modalElement) {
            throw new Error('No se encontró el elemento del modal en el DOM');
        }

        this.modal = new Modal(modalElement);
        this.setupGlobalListeners();

        modalLogger.info('🎭 ModalView inicializado');
    }

    /**
     * Configura listeners globales del modal
     */
    setupGlobalListeners() {
        // Event listener del botón de cerrar
        const closeModalBtn = document.querySelector('.close-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.close());
            modalLogger.debug('✓ Listener del botón cerrar agregado');
        }

        // Cerrar al hacer clic en el overlay
        const modalElement = document.getElementById('movie-modal');
        if (modalElement) {
            modalElement.addEventListener('click', (e) => {
                if (e.target === modalElement) {
                    this.close();
                }
            });
            modalLogger.debug('✓ Listener del overlay agregado');
        }
    }

    /**
     * Muestra el modal con los detalles de una película
     * @param {number|string} movieId - ID de la película
     */
    async showMovie(movieId) {
        if (!movieId) {
            modalLogger.error('ID de película inválido');
            return;
        }

        try {
            modalLogger.info(`🔄 Cargando detalles de película ID: ${movieId}`);
            const details = await TMDBService.getMovieDetails(movieId);

            if (details) {
                this.modal.open(details);
            } else {
                modalLogger.error('No se pudieron obtener los detalles de la película');
            }
        } catch (error) {
            modalLogger.error('Error al cargar detalles de la película:', error);
        }
    }

    /**
     * Muestra el modal con detalles ya cargados
     * @param {Object} movieDetails - Detalles completos de la película
     */
    showMovieDetails(movieDetails) {
        if (!movieDetails) {
            modalLogger.error('Detalles de película inválidos');
            return;
        }
        this.modal.open(movieDetails);
    }

    /**
     * Cierra el modal
     */
    close() {
        this.modal.close();
    }
}
