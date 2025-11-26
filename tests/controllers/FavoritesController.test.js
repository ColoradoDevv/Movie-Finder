import { FavoritesController } from '../../js/controllers/FavoritesController.js';
import { StorageService } from '../../js/services/StorageService.js';
import { MoviesView } from '../../js/ui/views/MoviesView.js';
import { EmptyStateView } from '../../js/ui/views/EmptyStateView.js';
import * as utils from '../../js/utils.js';
import * as mobileNav from '../../js/mobile-nav.js';

// Mock dependencies
jest.mock('../../js/services/StorageService.js', () => ({
    StorageService: {
        getFavorites: jest.fn(),
        getWatchedMovies: jest.fn(),
        isFavorite: jest.fn(),
        isWatched: jest.fn()
    }
}));

jest.mock('../../js/ui/views/MoviesView.js');
jest.mock('../../js/ui/views/EmptyStateView.js');

jest.mock('../../js/utils.js', () => ({
    clearResults: jest.fn(),
    showEmptyMessage: jest.fn(),
    sectionTitle: { textContent: '', classList: { add: jest.fn(), remove: jest.fn() } },
    resultsGrid: { querySelectorAll: jest.fn().mockReturnValue([]) }
}));

jest.mock('../../js/mobile-nav.js', () => ({
    syncNavigationState: jest.fn(),
    updateNavigationBadges: jest.fn()
}));

jest.mock('../../js/logger.js');

describe('FavoritesController', () => {
    let controller;
    let mockMoviesView;
    let mockEmptyStateView;

    beforeEach(() => {
        jest.clearAllMocks();

        document.body.innerHTML = `
            <div id="load-more"></div>
            <button id="favorites-button"></button>
            <button id="history-button"></button>
            <button id="mobile-favorites-button"></button>
            <button id="mobile-history-button"></button>
            <h1 id="section-title"></h1>
            <div id="results-grid"></div>
        `;

        utils.sectionTitle.textContent = '';

        // Setup mocks for views
        mockMoviesView = {
            render: jest.fn(),
            clear: jest.fn(),
            append: jest.fn()
        };
        mockEmptyStateView = {
            show: jest.fn(),
            hide: jest.fn(),
            clear: jest.fn()
        };

        MoviesView.mockImplementation(() => mockMoviesView);
        EmptyStateView.mockImplementation(() => mockEmptyStateView);

        controller = new FavoritesController();
    });

    describe('Display Favorites', () => {
        it('should display favorites list', () => {
            const favorites = [{ id: 1, title: 'Fav Movie' }];
            StorageService.getFavorites.mockReturnValue(favorites);

            controller.displayFavorites();

            expect(utils.sectionTitle.textContent).toBe('Mis favoritos');
            expect(mockMoviesView.render).toHaveBeenCalledWith(favorites);
            expect(mobileNav.syncNavigationState).toHaveBeenCalledWith('favorites');
        });

        it('should show empty message if no favorites', () => {
            StorageService.getFavorites.mockReturnValue([]);

            controller.displayFavorites();

            expect(mockEmptyStateView.show).toHaveBeenCalledWith(expect.stringContaining('Aún no tienes películas'));
        });

        it('should hide load more button', () => {
            const loadMoreBtn = document.getElementById('load-more');
            loadMoreBtn.style.display = 'block';

            StorageService.getFavorites.mockReturnValue([]);
            controller.displayFavorites();

            expect(loadMoreBtn.style.display).toBe('none');
        });
    });

    describe('Display History', () => {
        it('should display history list', () => {
            const watched = [{ id: 1, title: 'Watched Movie' }];
            StorageService.getWatchedMovies.mockReturnValue(watched);

            controller.displayHistory();

            expect(utils.sectionTitle.textContent).toBe('Películas vistas');
            expect(mockMoviesView.render).toHaveBeenCalledWith(watched);
            expect(mobileNav.syncNavigationState).toHaveBeenCalledWith('history');
        });

        it('should show empty message if no history', () => {
            StorageService.getWatchedMovies.mockReturnValue([]);

            controller.displayHistory();

            expect(mockEmptyStateView.show).toHaveBeenCalledWith(expect.stringContaining('Aún no has marcado ninguna película'));
        });
    });

    describe('Update Badges', () => {
        it('should update navigation badges', () => {
            StorageService.getFavorites.mockReturnValue([1, 2]);
            StorageService.getWatchedMovies.mockReturnValue([1]);

            controller.updateBadges();

            expect(mobileNav.updateNavigationBadges).toHaveBeenCalledWith(2, 1);
        });
    });
});
