import { FavoritesController } from '../../js/controllers/FavoritesController.js';
import { mainLogger } from '../../js/logger.js';
import { StorageService } from '../../js/services/StorageService.js';
import * as ui from '../../js/ui.js';
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
jest.mock('../../js/ui.js', () => ({
    displayMovies: jest.fn()
}));
jest.mock('../../js/utils.js', () => ({
    clearResults: jest.fn(),
    showEmptyMessage: jest.fn(),
    sectionTitle: { textContent: '', classList: { add: jest.fn(), remove: jest.fn() } }
}));
jest.mock('../../js/mobile-nav.js', () => ({
    syncNavigationState: jest.fn(),
    updateNavigationBadges: jest.fn()
}));
jest.mock('../../js/logger.js', () => ({
    mainLogger: { // Note: FavoritesController uses Logger class, but we mock the module if it imports 'mainLogger' or creates new Logger.
        // FavoritesController creates new Logger('FAVORITES_CONTROLLER').
        // We should mock the Logger class or just mock the instance methods if we can.
        // Since we are in ES modules, mocking classes is a bit different.
        // Let's assume Logger is default export or named export.
        // FavoritesController imports Logger from '../logger.js'.
    }
}));

// We need to mock the Logger class constructor
jest.mock('../../js/logger.js', () => {
    return function () {
        return {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            success: jest.fn(),
            debug: jest.fn()
        };
    };
});


describe('FavoritesController', () => {
    let controller;

    beforeEach(() => {
        jest.clearAllMocks();

        document.body.innerHTML = `
            <div id="load-more"></div>
            <button id="favorites-button"></button>
            <button id="history-button"></button>
            <button id="mobile-favorites-button"></button>
            <button id="mobile-history-button"></button>
            <h1 id="section-title"></h1>
        `;

        utils.sectionTitle.textContent = '';

        controller = new FavoritesController();
    });

    describe('Display Favorites', () => {
        it('should display favorites list', () => {
            const favorites = [{ id: 1, title: 'Fav Movie' }];
            StorageService.getFavorites.mockReturnValue(favorites);

            controller.displayFavorites();

            expect(utils.sectionTitle.textContent).toBe('Mis favoritos');
            expect(utils.clearResults).toHaveBeenCalled();
            expect(ui.displayMovies).toHaveBeenCalledWith(favorites);
            expect(mobileNav.syncNavigationState).toHaveBeenCalledWith('favorites');
        });

        it('should show empty message if no favorites', () => {
            StorageService.getFavorites.mockReturnValue([]);

            controller.displayFavorites();

            expect(utils.showEmptyMessage).toHaveBeenCalledWith(expect.stringContaining('Aún no tienes películas'));
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
            expect(utils.clearResults).toHaveBeenCalled();
            expect(ui.displayMovies).toHaveBeenCalledWith(watched);
            expect(mobileNav.syncNavigationState).toHaveBeenCalledWith('history');
        });

        it('should show empty message if no history', () => {
            StorageService.getWatchedMovies.mockReturnValue([]);

            controller.displayHistory();

            expect(utils.showEmptyMessage).toHaveBeenCalledWith(expect.stringContaining('Aún no has marcado ninguna película'));
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
