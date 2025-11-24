/**
 * Router.js
 * Sistema de routing para navegación entre secciones
 * Gestiona las rutas de la aplicación y coordina con controllers
 */

import { mainLogger } from '../logger.js';

const routerLogger = mainLogger;

export class Router {
    #routes = new Map();
    #state;
    #currentRoute = null;
    #currentParams = null;
    
    constructor(state) {
        if (!state) {
            throw new Error('Router requires a State instance');
        }
        
        this.#state = state;
        routerLogger.info('🧭 Router initialized');
    }
    
    // ==========================================
    // REGISTRO DE RUTAS
    // ==========================================
    
    /**
     * Registra una nueva ruta
     * @param {string} name - Nombre de la ruta
     * @param {function} handler - Función async a ejecutar
     * @param {object} options - Opciones (middleware, guards, etc)
     */
    register(name, handler, options = {}) {
        if (typeof handler !== 'function') {
            throw new Error(`Handler for route '${name}' must be a function`);
        }
        
        this.#routes.set(name, {
            handler,
            options,
            name
        });
        
        routerLogger.debug(`Route registered: ${name}`);
    }
    
    /**
     * Registra múltiples rutas a la vez
     * @param {object} routes - Objeto { routeName: handler }
     */
    registerMultiple(routes) {
        Object.entries(routes).forEach(([name, handler]) => {
            this.register(name, handler);
        });
    }
    
    /**
     * Verifica si una ruta existe
     * @param {string} name - Nombre de la ruta
     * @returns {boolean}
     */
    hasRoute(name) {
        return this.#routes.has(name);
    }
    
    // ==========================================
    // NAVEGACIÓN
    // ==========================================
    
    /**
     * Navega a una ruta
     * @param {string} routeName - Nombre de la ruta
     * @param {object} params - Parámetros opcionales
     * @returns {Promise<any>} - Resultado del handler
     */
    async navigate(routeName, params = {}) {
        routerLogger.info(`🧭 Navigating to: ${routeName}`, params);
        
        const route = this.#routes.get(routeName);
        
        // Ruta no encontrada → fallback
        if (!route) {
            routerLogger.warn(`Route not found: ${routeName}, redirecting to fallback`);
            return this.#handleNotFound(routeName);
        }
        
        // Guardar ruta actual
        const previousRoute = this.#currentRoute;
        this.#currentRoute = routeName;
        this.#currentParams = params;
        
        // Actualizar estado de navegación
        this.#state.set('navigation.currentSection', routeName);
        
        try {
            // Ejecutar middleware "before" si existe
            if (route.options.before) {
                const canContinue = await route.options.before(params);
                if (canContinue === false) {
                    routerLogger.warn(`Navigation to ${routeName} blocked by before hook`);
                    return;
                }
            }
            
            // Ejecutar handler de la ruta
            const result = await route.handler(params);
            
            // Ejecutar middleware "after" si existe
            if (route.options.after) {
                await route.options.after(result, params);
            }
            
            routerLogger.success(`✓ Navigation to ${routeName} completed`);
            
            return result;
            
        } catch (error) {
            routerLogger.error(`Error navigating to ${routeName}:`, error);
            
            // Ejecutar error handler si existe
            if (route.options.onError) {
                await route.options.onError(error, params);
            } else {
                // Error handler por defecto
                this.#handleError(routeName, error);
            }
            
            throw error;
        }
    }
    
    /**
     * Recarga la ruta actual
     */
    async reload() {
        if (!this.#currentRoute) {
            routerLogger.warn('No current route to reload');
            return;
        }
        
        routerLogger.info(`🔄 Reloading current route: ${this.#currentRoute}`);
        return this.navigate(this.#currentRoute, this.#currentParams);
    }
    
    /**
     * Navega hacia atrás (a la ruta anterior si existe)
     */
    async back() {
        // Implementación básica: ir a 'popular'
        // En una implementación completa, tendríamos un historial
        routerLogger.info('⬅️ Going back');
        return this.navigate('popular');
    }
    
    // ==========================================
    // GETTERS
    // ==========================================
    
    /**
     * Obtiene la ruta actual
     * @returns {string|null}
     */
    getCurrentRoute() {
        return this.#currentRoute;
    }
    
    /**
     * Obtiene los parámetros de la ruta actual
     * @returns {object|null}
     */
    getCurrentParams() {
        return this.#currentParams;
    }
    
    /**
     * Obtiene todas las rutas registradas
     * @returns {string[]}
     */
    getRoutes() {
        return Array.from(this.#routes.keys());
    }
    
    // ==========================================
    // HANDLERS DE ERROR
    // ==========================================
    
    /**
     * Handler cuando no se encuentra una ruta
     * @private
     */
    async #handleNotFound(routeName) {
        routerLogger.warn(`Route '${routeName}' not found, redirecting to 'popular'`);
        
        // Fallback a ruta por defecto
        if (this.hasRoute('popular')) {
            return this.navigate('popular');
        }
        
        // Si ni siquiera existe 'popular', mostrar error
        routerLogger.error('No fallback route available');
        throw new Error(`Route not found: ${routeName}`);
    }
    
    /**
     * Handler de errores de navegación
     * @private
     */
    #handleError(routeName, error) {
        routerLogger.error(`Navigation error in route '${routeName}':`, error.message);
        
        // Podrías emitir un evento global de error aquí
        // eventBus.emit('router:error', { routeName, error });
    }
    
    // ==========================================
    // DEBUGGING
    // ==========================================
    
    /**
     * Imprime información del router
     */
    debug() {
        routerLogger.group('🧭 Router Debug Info');
        routerLogger.info('Current route:', this.#currentRoute);
        routerLogger.info('Current params:', this.#currentParams);
        routerLogger.info('Registered routes:', this.getRoutes());
        routerLogger.groupEnd();
    }
}   