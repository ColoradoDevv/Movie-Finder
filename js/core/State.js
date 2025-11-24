/**
 * State.js
 * Gestión centralizada del estado de la aplicación
 * Implementa patrón Observer para notificaciones reactivas
 */

import { mainLogger } from '../logger.js';

const stateLogger = mainLogger; // Reutilizar logger existente

export class State {
    // Estado privado
    #state = {
        // Paginación
        pagination: {
            currentPage: 1,
            totalPages: 1
        },
        
        // Filtros
        filters: {
            sortBy: 'default',
            year: '',
            rating: ''
        },
        
        // Navegación
        navigation: {
            currentSection: 'popular',
            currentEndpoint: 'movie/popular',
            activeGenreId: null
        },
        
        // Datos de películas
        movies: {
            cache: [],          // Todas las películas cargadas de API
            displayed: [],      // Películas después de aplicar filtros
            searchQuery: ''     // Query de búsqueda actual
        },
        
        // Datos del usuario (sincronizado con localStorage)
        user: {
            favorites: [],
            watched: []
        },
        
        // Recomendaciones
        recommendations: {
            current: null,      // Película recomendada actual
            history: []         // IDs de películas ya recomendadas
        },
        
        // UI state
        ui: {
            isLoading: false,
            modalOpen: false,
            sidebarOpen: false
        }
    };
    
    // Mapa de listeners: path → Set<callback>
    #listeners = new Map();
    
    constructor() {
        stateLogger.info('🧠 State module initialized');
        stateLogger.debug('Initial state:', this.#state);
    }
    
    // ==========================================
    // GETTERS
    // ==========================================
    
    /**
     * Obtiene un valor del estado usando path notation
     * @param {string} path - Ruta al valor (ej: 'pagination.currentPage')
     * @returns {any} - Valor en el path
     */
    get(path) {
        const value = this.#getNestedValue(path);
        stateLogger.debug(`State.get('${path}'):`, value);
        return value;
    }
    
    /**
     * Obtiene todo el estado (copia profunda para prevenir mutaciones)
     * @returns {object} - Copia del estado completo
     */
    getAll() {
        return JSON.parse(JSON.stringify(this.#state));
    }
    
    // ==========================================
    // SETTERS
    // ==========================================
    
    /**
     * Actualiza un valor del estado y notifica a listeners
     * @param {string} path - Ruta al valor
     * @param {any} value - Nuevo valor
     */
    set(path, value) {
        const oldValue = this.#getNestedValue(path);
        
        // Solo actualizar si cambió
        if (JSON.stringify(oldValue) === JSON.stringify(value)) {
            stateLogger.debug(`State.set('${path}'): No cambió, skip`);
            return;
        }
        
        this.#setNestedValue(path, value);
        
        stateLogger.info(`State.set('${path}'):`, value);
        
        // Notificar a listeners
        this.#notify(path, value, oldValue);
    }
    
    /**
     * Actualiza múltiples valores del estado
     * @param {object} updates - Objeto con paths y valores
     */
    setMultiple(updates) {
        stateLogger.debug('State.setMultiple:', updates);
        
        Object.entries(updates).forEach(([path, value]) => {
            this.set(path, value);
        });
    }
    
    /**
     * Resetea una sección del estado a su valor por defecto
     * @param {string} section - Sección a resetear (ej: 'filters')
     */
    reset(section) {
        const defaults = {
            pagination: {
                currentPage: 1,
                totalPages: 1
            },
            filters: {
                sortBy: 'default',
                year: '',
                rating: ''
            },
            navigation: {
                currentSection: 'popular',
                currentEndpoint: 'movie/popular',
                activeGenreId: null
            },
            movies: {
                cache: [],
                displayed: [],
                searchQuery: ''
            },
            user: {
                favorites: [],
                watched: []
            },
            recommendations: {
                current: null,
                history: []
            },
            ui: {
                isLoading: false,
                modalOpen: false,
                sidebarOpen: false
            }
        };
        
        if (defaults[section]) {
            this.#state[section] = { ...defaults[section] };
            stateLogger.info(`State.reset('${section}')`);
            this.#notify(section, this.#state[section]);
        }
    }
    
    // ==========================================
    // SUBSCRIPTIONS (Observer Pattern)
    // ==========================================
    
    /**
     * Suscribirse a cambios en un path del estado
     * @param {string} path - Path a observar
     * @param {function} callback - Función a ejecutar cuando cambie
     * @returns {function} - Función para cancelar suscripción
     */
    subscribe(path, callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        if (!this.#listeners.has(path)) {
            this.#listeners.set(path, new Set());
        }
        
        this.#listeners.get(path).add(callback);
        
        stateLogger.debug(`Subscribed to '${path}' (${this.#listeners.get(path).size} listeners)`);
        
        // Retornar función de cleanup
        return () => {
            this.unsubscribe(path, callback);
        };
    }
    
    /**
     * Cancelar suscripción
     * @param {string} path - Path
     * @param {function} callback - Callback a remover
     */
    unsubscribe(path, callback) {
        const listeners = this.#listeners.get(path);
        if (listeners) {
            listeners.delete(callback);
            stateLogger.debug(`Unsubscribed from '${path}' (${listeners.size} listeners remaining)`);
        }
    }
    
    /**
     * Suscribirse a cambios una sola vez
     * @param {string} path - Path a observar
     * @param {function} callback - Función a ejecutar
     */
    once(path, callback) {
        const onceCallback = (value, oldValue) => {
            callback(value, oldValue);
            this.unsubscribe(path, onceCallback);
        };
        
        this.subscribe(path, onceCallback);
    }
    
    // ==========================================
    // HELPERS PRIVADOS
    // ==========================================
    
    /**
     * Obtiene valor anidado usando dot notation
     * @private
     */
    #getNestedValue(path) {
        const keys = path.split('.');
        let value = this.#state;
        
        for (const key of keys) {
            if (value === undefined || value === null) {
                return undefined;
            }
            value = value[key];
        }
        
        return value;
    }
    
    /**
     * Establece valor anidado usando dot notation
     * @private
     */
    #setNestedValue(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.#state;
        
        // Navegar hasta el penúltimo nivel
        for (const key of keys) {
            if (!(key in target)) {
                target[key] = {};
            }
            target = target[key];
        }
        
        // Establecer valor
        target[lastKey] = value;
    }
    
    /**
     * Notifica a todos los listeners de un path
     * @private
     */
    #notify(path, newValue, oldValue) {
        // Notificar listeners exactos
        const exactListeners = this.#listeners.get(path);
        if (exactListeners) {
            exactListeners.forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    stateLogger.error(`Error in listener for '${path}':`, error);
                }
            });
        }
        
        // Notificar listeners de paths padres
        // Ej: si cambia 'pagination.currentPage', notificar a 'pagination'
        const parts = path.split('.');
        for (let i = parts.length - 1; i > 0; i--) {
            const parentPath = parts.slice(0, i).join('.');
            const parentListeners = this.#listeners.get(parentPath);
            
            if (parentListeners) {
                const parentValue = this.#getNestedValue(parentPath);
                parentListeners.forEach(callback => {
                    try {
                        callback(parentValue, undefined);
                    } catch (error) {
                        stateLogger.error(`Error in parent listener for '${parentPath}':`, error);
                    }
                });
            }
        }
    }
    
    // ==========================================
    // DEBUGGING
    // ==========================================
    
    /**
     * Imprime el estado completo (solo desarrollo)
     */
    debug() {
        stateLogger.group('📊 Current State');
        stateLogger.info('Pagination:', this.#state.pagination);
        stateLogger.info('Filters:', this.#state.filters);
        stateLogger.info('Navigation:', this.#state.navigation);
        stateLogger.info('Movies cache:', `${this.#state.movies.cache.length} items`);
        stateLogger.info('Movies displayed:', `${this.#state.movies.displayed.length} items`);
        stateLogger.info('Favorites:', `${this.#state.user.favorites.length} items`);
        stateLogger.info('Watched:', `${this.#state.user.watched.length} items`);
        stateLogger.info('UI:', this.#state.ui);
        stateLogger.groupEnd();
    }
    
    /**
     * Imprime todos los listeners activos
     */
    debugListeners() {
        stateLogger.group('👂 Active Listeners');
        this.#listeners.forEach((listeners, path) => {
            stateLogger.info(`${path}: ${listeners.size} listener(s)`);
        });
        stateLogger.groupEnd();
    }
}