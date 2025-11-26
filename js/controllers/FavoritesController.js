import { StorageService } from '../services/StorageService.js';
import { MoviesView } from '../ui/views/MoviesView.js';
import { EmptyStateView } from '../ui/views/EmptyStateView.js';
import { clearResults, sectionTitle, resultsGrid } from '../utils.js';
import Logger from '../logger.js';
import { syncNavigationState, updateNavigationBadges } from '../mobile-nav.js';

export class FavoritesController {
    constructor(state) {
        this.state = state;
        this.logger = new Logger('FAVORITES_CONTROLLER');
        this.dom = {
            loadMoreButton: document.getElementById('load-more'),
            favoritesButton: document.getElementById('favorites-button'),
            historyButton: document.getElementById('history-button'),
            mobileFavoritesButton: document.getElementById('mobile-favorites-button'),
            mobileHistoryButton: document.getElementById('mobile-history-button')
        };

        // Inicializar vistas
        this.moviesView = new MoviesView(resultsGrid);
        this.emptyStateView = new EmptyStateView(resultsGrid);

        this.logger.info('❤️ FavoritesController inicializado con State centralizado');
    }

    init() {
        // La sincronización inicial ya la realiza StateStorageSync
        this._setupEventListeners();
        this._setupSubscribers();

        // Actualizar badges iniciales
        this.updateBadges();
    }

    _setupEventListeners() {
        if (this.dom.favoritesButton) {
            this.dom.favoritesButton.addEventListener('click', () => this.displayFavorites());
        }

        if (this.dom.mobileFavoritesButton) {
            this.dom.mobileFavoritesButton.addEventListener('click', () => this.displayFavorites());
        }

        if (this.dom.historyButton) {
            this.dom.historyButton.addEventListener('click', () => this.displayHistory());
        }

        if (this.dom.mobileHistoryButton) {
            this.dom.mobileHistoryButton.addEventListener('click', () => this.displayHistory());
        }
    }

    _setupSubscribers() {
        // Actualizar badges cuando cambien favoritos o vistos
        this.state.subscribe('user.favorites', (favorites) => {
            this.updateBadges();
            // Si estamos viendo favoritos, recargar la vista
            if (this.state.get('navigation.currentSection') === 'favorites') {
                this.displayFavorites();
            }
        });

        this.state.subscribe('user.watched', (watched) => {
            this.updateBadges();
            // Si estamos viendo historial, recargar la vista
            if (this.state.get('navigation.currentSection') === 'history') {
                this.displayHistory();
            }
        });
    }

    /**
     * Muestra la lista de favoritos
     */
    displayFavorites() {
        this.logger.info('❤️ Mostrando favoritos...');

        // Actualizar estado de navegación
        this.state.set('navigation.currentSection', 'favorites');

        // Actualizar título y estado visual
        sectionTitle.textContent = 'Mis favoritos';
        sectionTitle.classList.remove('christmas-title');

        // Ocultar botón de cargar más
        if (this.dom.loadMoreButton) this.dom.loadMoreButton.style.display = 'none';

        // Limpiar resultados anteriores
        clearResults();

        const favorites = this.state.get('user.favorites');

        if (favorites.length === 0) {
            this.emptyStateView.show('Aún no tienes películas en favoritos');
        } else {
            this.moviesView.render(favorites);
            this.logger.success(`✓ Mostrando ${favorites.length} favoritos`);
        }

        syncNavigationState('favorites');
    }

    /**
     * Muestra el historial de vistas
     */
    displayHistory() {
        this.logger.info('📺 Mostrando historial...');

        // Actualizar estado de navegación
        this.state.set('navigation.currentSection', 'history');

        // Actualizar título y estado visual
        sectionTitle.textContent = 'Películas vistas';
        sectionTitle.classList.remove('christmas-title');

        // Ocultar botón de cargar más
        if (this.dom.loadMoreButton) this.dom.loadMoreButton.style.display = 'none';

        // Limpiar resultados anteriores
        clearResults();

        const watched = this.state.get('user.watched');

        if (watched.length === 0) {
            this.emptyStateView.show('Aún no has marcado ninguna película como vista');
        } else {
            this.moviesView.render(watched);
            this.logger.success(`✓ Mostrando ${watched.length} películas vistas`);
        }

        syncNavigationState('history');
    }

    /**
     * Actualiza los badges de contadores en la navegación
     */
    updateBadges() {
        const favorites = this.state.get('user.favorites') || [];
        const watched = this.state.get('user.watched') || [];
        updateNavigationBadges(favorites.length, watched.length);
    }
}
