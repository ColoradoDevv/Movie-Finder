import { StorageService } from '../services/StorageService.js';
import { MoviesView } from '../ui/views/MoviesView.js';
import { EmptyStateView } from '../ui/views/EmptyStateView.js';
import { clearResults, sectionTitle, resultsGrid } from '../utils.js';
import Logger from '../logger.js';
import { syncNavigationState, updateNavigationBadges } from '../mobile-nav.js';

export class FavoritesController {
    constructor() {
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

        this.logger.info('❤️ FavoritesController inicializado');
    }

    init() {
        this.updateBadges();
        this._setupEventListeners();
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

    /**
     * Muestra la lista de favoritos
     */
    displayFavorites() {
        this.logger.info('❤️ Mostrando favoritos...');

        // Actualizar título y estado visual
        sectionTitle.textContent = 'Mis favoritos';
        sectionTitle.classList.remove('christmas-title');

        // Ocultar botón de cargar más
        if (this.dom.loadMoreButton) this.dom.loadMoreButton.style.display = 'none';

        // Limpiar resultados anteriores
        clearResults();

        const favorites = StorageService.getFavorites();

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

        // Actualizar título y estado visual
        sectionTitle.textContent = 'Películas vistas';
        sectionTitle.classList.remove('christmas-title');

        // Ocultar botón de cargar más
        if (this.dom.loadMoreButton) this.dom.loadMoreButton.style.display = 'none';

        // Limpiar resultados anteriores
        clearResults();

        const watched = StorageService.getWatchedMovies();

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
        updateNavigationBadges(StorageService.getFavorites().length, StorageService.getWatchedMovies().length);
    }
}
