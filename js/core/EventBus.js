/**
 * EventBus.js
 * Sistema de comunicación desacoplada entre módulos (Pub/Sub pattern)
 * Permite que los módulos se comuniquen sin conocerse directamente
 */

import { mainLogger } from '../logger.js';

const eventLogger = mainLogger;

export class EventBus {
    // Mapa de eventos: eventName → Set<callback>
    #events = new Map();
    
    // Historial de eventos (útil para debugging)
    #history = [];
    #maxHistory = 50; // Mantener últimos 50 eventos
    
    constructor() {
        eventLogger.info('📡 EventBus initialized');
    }
    
    // ==========================================
    // SUSCRIPCIÓN
    // ==========================================
    
    /**
     * Suscribirse a un evento
     * @param {string} eventName - Nombre del evento
     * @param {function} callback - Función a ejecutar
     * @returns {function} - Función para cancelar suscripción
     */
    on(eventName, callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        if (!this.#events.has(eventName)) {
            this.#events.set(eventName, new Set());
        }
        
        this.#events.get(eventName).add(callback);
        
        eventLogger.debug(`Subscribed to '${eventName}' (${this.#events.get(eventName).size} listeners)`);
        
        // Retornar función de cleanup
        return () => {
            this.off(eventName, callback);
        };
    }
    
    /**
     * Suscribirse a múltiples eventos a la vez
     * @param {object} events - Objeto { eventName: callback }
     * @returns {function} - Función para cancelar todas las suscripciones
     */
    onMultiple(events) {
        const unsubscribers = [];
        
        Object.entries(events).forEach(([eventName, callback]) => {
            const unsub = this.on(eventName, callback);
            unsubscribers.push(unsub);
        });
        
        // Retornar función que cancela todas
        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }
    
    /**
     * Suscribirse a un evento una sola vez
     * @param {string} eventName - Nombre del evento
     * @param {function} callback - Función a ejecutar
     */
    once(eventName, callback) {
        const onceCallback = (data) => {
            callback(data);
            this.off(eventName, onceCallback);
        };
        
        this.on(eventName, onceCallback);
    }
    
    /**
     * Cancelar suscripción a un evento
     * @param {string} eventName - Nombre del evento
     * @param {function} callback - Callback a remover
     */
    off(eventName, callback) {
        const callbacks = this.#events.get(eventName);
        
        if (callbacks) {
            callbacks.delete(callback);
            eventLogger.debug(`Unsubscribed from '${eventName}' (${callbacks.size} listeners remaining)`);
            
            // Limpiar si no quedan listeners
            if (callbacks.size === 0) {
                this.#events.delete(eventName);
            }
        }
    }
    
    /**
     * Cancelar todas las suscripciones de un evento
     * @param {string} eventName - Nombre del evento
     */
    offAll(eventName) {
        if (this.#events.has(eventName)) {
            this.#events.delete(eventName);
            eventLogger.debug(`All listeners removed from '${eventName}'`);
        }
    }
    
    // ==========================================
    // EMISIÓN
    // ==========================================
    
    /**
     * Emitir un evento
     * @param {string} eventName - Nombre del evento
     * @param {any} data - Datos a pasar a los callbacks
     */
    emit(eventName, data = null) {
        eventLogger.info(`📡 Event emitted: ${eventName}`, data);
        
        // Guardar en historial
        this.#addToHistory(eventName, data);
        
        const callbacks = this.#events.get(eventName);
        
        if (!callbacks || callbacks.size === 0) {
            eventLogger.debug(`No listeners for event '${eventName}'`);
            return;
        }
        
        // Ejecutar todos los callbacks
        let executedCount = 0;
        let errorCount = 0;
        
        callbacks.forEach(callback => {
            try {
                callback(data);
                executedCount++;
            } catch (error) {
                errorCount++;
                eventLogger.error(`Error in listener for '${eventName}':`, error);
            }
        });
        
        eventLogger.debug(`Event '${eventName}': ${executedCount} executed, ${errorCount} errors`);
    }
    
    /**
     * Emitir evento de forma asíncrona (útil para evitar bloqueos)
     * @param {string} eventName - Nombre del evento
     * @param {any} data - Datos
     * @returns {Promise<void>}
     */
    async emitAsync(eventName, data = null) {
        eventLogger.info(`📡 Event emitted (async): ${eventName}`, data);
        
        this.#addToHistory(eventName, data);
        
        const callbacks = this.#events.get(eventName);
        
        if (!callbacks || callbacks.size === 0) {
            return;
        }
        
        // Ejecutar callbacks en paralelo
        const promises = Array.from(callbacks).map(callback => {
            return Promise.resolve()
                .then(() => callback(data))
                .catch(error => {
                    eventLogger.error(`Error in async listener for '${eventName}':`, error);
                });
        });
        
        await Promise.all(promises);
    }
    
    // ==========================================
    // UTILIDADES
    // ==========================================
    
    /**
     * Verifica si hay listeners para un evento
     * @param {string} eventName - Nombre del evento
     * @returns {boolean}
     */
    hasListeners(eventName) {
        const callbacks = this.#events.get(eventName);
        return callbacks && callbacks.size > 0;
    }
    
    /**
     * Obtiene el número de listeners de un evento
     * @param {string} eventName - Nombre del evento
     * @returns {number}
     */
    getListenerCount(eventName) {
        const callbacks = this.#events.get(eventName);
        return callbacks ? callbacks.size : 0;
    }
    
    /**
     * Obtiene todos los eventos con listeners activos
     * @returns {string[]}
     */
    getActiveEvents() {
        return Array.from(this.#events.keys());
    }
    
    /**
     * Limpia todos los listeners
     */
    clear() {
        const eventCount = this.#events.size;
        this.#events.clear();
        eventLogger.info(`EventBus cleared (${eventCount} events removed)`);
    }
    
    // ==========================================
    // HISTORIAL (DEBUGGING)
    // ==========================================
    
    /**
     * Agrega evento al historial
     * @private
     */
    #addToHistory(eventName, data) {
        this.#history.push({
            eventName,
            data,
            timestamp: new Date().toISOString()
        });
        
        // Mantener solo los últimos N eventos
        if (this.#history.length > this.#maxHistory) {
            this.#history.shift();
        }
    }
    
    /**
     * Obtiene el historial de eventos
     * @param {number} limit - Número de eventos a retornar
     * @returns {array}
     */
    getHistory(limit = 10) {
        return this.#history.slice(-limit);
    }
    
    /**
     * Limpia el historial
     */
    clearHistory() {
        this.#history = [];
        eventLogger.debug('Event history cleared');
    }
    
    // ==========================================
    // DEBUGGING
    // ==========================================
    
    /**
     * Imprime información del EventBus
     */
    debug() {
        eventLogger.group('📡 EventBus Debug Info');
        eventLogger.info('Active events:', this.getActiveEvents());
        
        this.#events.forEach((callbacks, eventName) => {
            eventLogger.info(`  ${eventName}: ${callbacks.size} listener(s)`);
        });
        
        eventLogger.info('Recent events:', this.getHistory(5));
        eventLogger.groupEnd();
    }
}