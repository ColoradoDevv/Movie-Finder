import { StorageService } from '../services/StorageService.js';
import { mainLogger } from '../logger.js';

export class StateStorageSync {
    constructor(state) {
        this.state = state;
        this.logger = mainLogger;
    }

    /**
     * Inicializa la sincronización
     */
    init() {
        this.logger.info('💾 Inicializando sincronización de estado...');
        this.syncFromStorage();
        this.setupSubscribers();
    }

    setupSubscribers() {
        // Guardar historial de recomendaciones cuando cambie
        this.state.subscribe('recommendations.history', (history) => {
            try {
                localStorage.setItem('moviefinder_recommendation_history', JSON.stringify(history));
                this.logger.debug(`💾 Historial de recomendaciones guardado: ${history.length} items`);
            } catch (e) {
                this.logger.error('Error al guardar historial de recomendaciones:', e);
            }
        });
    }

    /**
     * Sincroniza el estado desde localStorage
     */
    syncFromStorage() {
        this.logger.debug('🔄 Sincronizando State desde StorageService...');

        const favorites = StorageService.getFavorites();
        const watched = StorageService.getWatchedMovies();

        // Actualizar State (esto disparará los suscriptores)
        this.state.set('user.favorites', favorites);
        this.state.set('user.watched', watched);

        // Sincronizar historial de recomendaciones
        try {
            const recHistory = JSON.parse(localStorage.getItem('moviefinder_recommendation_history') || '[]');
            this.state.set('recommendations.history', recHistory);
        } catch (e) {
            this.logger.error('Error al leer historial de recomendaciones:', e);
        }
    }
}
