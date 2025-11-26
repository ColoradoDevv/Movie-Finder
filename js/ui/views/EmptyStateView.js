/**
 * EmptyStateView.js
 * Vista para mostrar estados vacíos
 */

import { uiLogger } from '../../logger.js';

/**
 * Vista para mostrar mensajes de estado vacío
 */
export class EmptyStateView {
    /**
     * @param {HTMLElement} container - Contenedor donde se mostrará el mensaje
     */
    constructor(container) {
        if (!container) {
            throw new Error('EmptyStateView requiere un contenedor válido');
        }
        this.container = container;
        uiLogger.debug('📭 EmptyStateView inicializado');
    }

    /**
     * Muestra un mensaje de estado vacío
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de mensaje ('info', 'warning', 'error')
     */
    show(message, type = 'info') {
        if (!message) {
            uiLogger.warn('No se proporcionó mensaje para EmptyStateView');
            return;
        }

        this.clear();

        const className = `empty-message empty-message--${type}`;
        this.container.innerHTML = `<div class="${className}">${message}</div>`;

        uiLogger.info(`📭 Mostrando estado vacío: "${message}"`);
    }

    /**
     * Limpia el contenedor
     */
    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    /**
     * Oculta el mensaje de estado vacío
     */
    hide() {
        this.clear();
        uiLogger.debug('📭 Estado vacío ocultado');
    }
}
