import { MoviesController } from '../../js/controllers/MoviesController.js';
import { mainLogger } from '../../js/logger.js';
import { TMDBService } from '../../js/services/TMDBService.js';
import { StorageService } from '../../js/services/StorageService.js';
import { FiltersService } from '../../js/services/FiltersService.js';
import { MoviesView } from '../../js/ui/views/MoviesView.js';
import { EmptyStateView } from '../../js/ui/views/EmptyStateView.js';
import * as utils from '../../js/utils.js';
import * as mobileNav from '../../js/mobile-nav.js';
import { StateMock } from '../mocks/StateMock.js';

// Mock dependencies
jest.mock('../../js/services/TMDBService.js', () => ({
    TMDBService: {
        loadGenres: jest.fn(),
        getMovies: jest.fn(),
        getMovieDetails: jest.fn()
    }
}));
jest.mock('../../js/services/StorageService.js', () => ({
    StorageService: {
        getFavorites: jest.fn(),
        getWatchedMovies: jest.fn(),
        isFavorite: jest.fn(),
        isWatched: jest.fn()
    }
}));
jest.mock('../../js/services/FiltersService.js', () => ({
    FiltersService: {
        applyFilters: jest.fn()
    }
}));

jest.mock('../../js/ui/views/MoviesView.js');
jest.mock('../../js/ui/views/EmptyStateView.js');

jest.mock('../../js/utils.js', () => ({
    showLoader: jest.fn(),
    hideLoader: jest.fn(),
    clearResults: jest.fn(),
    sectionTitle: { textContent: '', classList: { add: jest.fn(), remove: jest.fn() } },
    resultsGrid: { querySelectorAll: jest.fn().mockReturnValue([]) },
    modal: { addEventListener: jest.fn() }
}));
jest.mock('../../js/mobile-nav.js', () => ({
    syncNavigationState: jest.fn(),
    updateNavigationBadges: jest.fn()
}));
jest.mock('../../js/logger.js', () => ({
    mainLogger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        success: jest.fn(),
        debug: jest.fn(),
        time: jest.fn(),
        timeEnd: jest.fn(),
        group: jest.fn(),
        groupEnd: jest.fn()
    }
}));

describe('MoviesController', () => {
    let controller;
    let mockMoviesView;
    let mockEmptyStateView;
    let mockState;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Setup DOM elements
        document.body.innerHTML = `
            <div id="load-more"></div>
            <div id="genre-nav"></div>
            <select id="recommendation-genre">
                <option value="">Default</option>
            </select>
            <input id="searchInput" />
            <div id="results-count"></div>
            <h1 id="section-title"></h1>
            <div id="results-grid"></div>
        `;

        // Mock Utils DOM elements
        utils.sectionTitle.textContent = '';
        utils.resultsGrid.innerHTML = '';

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

        mockState = new StateMock();
        controller = new MoviesController(mockState);
    });

    describe('Initialization', () => {
        it('should initialize correctly', async () => {
            TMDBService.loadGenres.mockResolvedValue({ genres: [] });
            TMDBService.getMovies.mockResolvedValue({ results: [], total_pages: 1 });
            StorageService.getFavorites.mockReturnValue([]);
            StorageService.getWatchedMovies.mockReturnValue([]);

            await controller.init();

            expect(TMDBService.loadGenres).toHaveBeenCalled();
            expect(TMDBService.getMovies).toHaveBeenCalledWith('movie/popular', 1);
        });
    });

    describe('Navigation', () => {
        it('should navigate to popular', async () => {
            const spy = jest.spyOn(controller, 'loadPopularMovies').mockImplementation();
            await controller.navigateToSection('popular');
            expect(spy).toHaveBeenCalled();
            expect(mobileNav.syncNavigationState).toHaveBeenCalledWith('popular');
            expect(mockState.get('navigation.currentSection')).toBe('popular');
        });

        it('should navigate to top-rated', async () => {
            const spy = jest.spyOn(controller, 'loadTopRatedMovies').mockImplementation();
            await controller.navigateToSection('top-rated');
            expect(spy).toHaveBeenCalled();
        });

        it('should navigate to upcoming', async () => {
            const spy = jest.spyOn(controller, 'loadUpcomingMovies').mockImplementation();
            await controller.navigateToSection('upcoming');
            expect(spy).toHaveBeenCalled();
        });

        it('should log warning when navigating to favorites (handled by FavoritesController)', async () => {
            await controller.navigateToSection('favorites');
            expect(mainLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Sección desconocida'));
        });
    });

    describe('Data Fetching', () => {
        it('should load popular movies successfully', async () => {
            const mockMovies = [{ id: 1, title: 'Movie 1' }];
            TMDBService.getMovies.mockResolvedValue({ results: mockMovies, total_pages: 5 });
            FiltersService.applyFilters.mockReturnValue(mockMovies);

            await controller.loadPopularMovies();

            expect(utils.showLoader).toHaveBeenCalled();
            expect(TMDBService.getMovies).toHaveBeenCalledWith('movie/popular', 1);
            expect(utils.hideLoader).toHaveBeenCalled();
            expect(mockMoviesView.render).toHaveBeenCalledWith(mockMovies);
            expect(mockState.get('pagination.currentPage')).toBe(1);
            expect(mockState.get('pagination.totalPages')).toBe(5);
        });

        it('should handle error when loading movies', async () => {
            TMDBService.getMovies.mockRejectedValue(new Error('Network error'));

            await controller.loadPopularMovies();
            expect(mockEmptyStateView.show).toHaveBeenCalledWith(expect.stringContaining('Error de conexión'));
        });

        it('should load movies by genre', async () => {
            const mockMovies = [{ id: 1, title: 'Genre Movie' }];
            TMDBService.getMovies.mockResolvedValue({ results: mockMovies, total_pages: 1 });

            await controller.loadMoviesByGenre('28', 'Action');

            expect(mockState.get('navigation.currentSection')).toBe('genre');
            expect(utils.sectionTitle.textContent).toBe('Action');
            expect(TMDBService.getMovies).toHaveBeenCalledWith(expect.stringContaining('with_genres=28'), 1);
        });
    });

    describe('Pagination', () => {
        it('should load more movies', async () => {
            // Setup initial state
            mockState.set('pagination.currentPage', 1);
            mockState.set('pagination.totalPages', 5);
            mockState.set('navigation.currentEndpoint', 'movie/popular');
            mockState.set('movies.cache', [{ id: 1 }]);

            const newMovies = [{ id: 2 }];
            TMDBService.getMovies.mockResolvedValue({ results: newMovies, page: 2, total_pages: 5 });
            FiltersService.applyFilters.mockImplementation(movies => movies);

            await controller.loadMore();

            expect(TMDBService.getMovies).toHaveBeenCalledWith('movie/popular', 2);
            expect(mockState.get('movies.cache').length).toBe(2);
            expect(mockMoviesView.append).toHaveBeenCalled();
            expect(mockState.get('pagination.currentPage')).toBe(2);
        });

        it('should not load more if on last page', async () => {
            mockState.set('pagination.currentPage', 5);
            mockState.set('pagination.totalPages', 5);

            await controller.loadMore();

            expect(TMDBService.getMovies).not.toHaveBeenCalled();
        });
    });

    // Additional rigorous tests for edge cases
    describe('Init Genres Failure', () => {
        it('should handle error when loading genres', async () => {
            TMDBService.loadGenres.mockRejectedValue(new Error('Network error'));
            await controller.initGenres();
            expect(mainLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error al inicializar géneros'));
        });
    });

    describe('Christmas Movies', () => {
        it('should filter and display only christmas related movies', async () => {
            const mixedMovies = [
                { id: 1, title: 'Christmas Carol' },
                { id: 2, title: 'Random Movie' },
                { id: 3, title: 'Navidad en la ciudad' }
            ];
            TMDBService.getMovies.mockResolvedValue({ results: mixedMovies, total_pages: 1 });
            await controller.loadChristmasMovies();
            expect(utils.showLoader).toHaveBeenCalled();
            expect(utils.hideLoader).toHaveBeenCalled();
            // Expect only the christmas related movies to be displayed
            expect(mockMoviesView.render).toHaveBeenCalledWith([
                { id: 1, title: 'Christmas Carol' },
                { id: 3, title: 'Navidad en la ciudad' }
            ]);
        });
    });

    describe('Pagination Edge Cases', () => {
        it('should not call TMDBService when already on last page', async () => {
            mockState.set('pagination.currentPage', 3);
            mockState.set('pagination.totalPages', 3);
            await controller.loadMore();
            expect(TMDBService.getMovies).not.toHaveBeenCalled();
        });
    });

    describe('Christmas Movies Fallback', () => {
        it('should fallback to raw results if no christmas keywords found', async () => {
            const genericMovies = [
                { id: 1, title: 'Action Movie' },
                { id: 2, title: 'Comedy Movie' }
            ];
            TMDBService.getMovies.mockResolvedValue({ results: genericMovies, total_pages: 1 });

            await controller.loadChristmasMovies();

            expect(mockMoviesView.render).toHaveBeenCalledWith(genericMovies);
            expect(mainLogger.success).toHaveBeenCalledWith(expect.stringContaining('películas relacionadas cargadas'));
        });

        it('should handle empty results gracefully', async () => {
            TMDBService.getMovies.mockResolvedValue({ results: [], total_pages: 1 });

            await controller.loadChristmasMovies();

            expect(mockEmptyStateView.show).toHaveBeenCalledWith(expect.stringContaining('No se encontraron películas navideñas'));
        });
    });

    describe('Update Grid DOM Updates', () => {
        it('should return early if currentSection is favorites or history', () => {
            mockState.set('navigation.currentSection', 'favorites');
            controller.updateGrid();
            expect(utils.resultsGrid.querySelectorAll).not.toHaveBeenCalled();

            mockState.set('navigation.currentSection', 'history');
            controller.updateGrid();
            expect(utils.resultsGrid.querySelectorAll).not.toHaveBeenCalled();
        });
    });

    describe('Load More Filtering', () => {
        it('should filter out non-movie media types', async () => {
            mockState.set('pagination.currentPage', 1);
            mockState.set('pagination.totalPages', 5);
            mockState.set('movies.cache', []);
            mockState.set('navigation.currentEndpoint', 'movie/popular');

            const mixedResults = [
                { id: 1, title: 'Movie 1', media_type: 'movie' },
                { id: 2, name: 'Person 1', media_type: 'person' },
                { id: 3, title: 'Movie 2' } // implicit movie
            ];

            TMDBService.getMovies.mockResolvedValue({ results: mixedResults, page: 2, total_pages: 5 });
            FiltersService.applyFilters.mockImplementation(m => m);

            await controller.loadMore();

            expect(mockState.get('movies.cache').length).toBe(2);
            expect(mockState.get('movies.cache').find(m => m.id === 2)).toBeUndefined();
        });
    });

    describe('Init Genres DOM Cleanup', () => {
        it('should clear existing genres before adding new ones', async () => {
            // Setup initial DOM with garbage
            const genreNav = document.getElementById('genre-nav');
            genreNav.innerHTML = '<button>Old Genre</button>';

            TMDBService.loadGenres.mockResolvedValue({
                genres: [{ id: 1, name: 'New Genre' }]
            });

            await controller.initGenres();

            expect(genreNav.innerHTML).not.toContain('Old Genre');
            expect(genreNav.textContent).toContain('New Genre');
            expect(genreNav.textContent).toContain('Películas Navideñas'); // The hardcoded one
        });
    });

    describe('Navigation Default Case', () => {
        it('should log warning for unknown section', async () => {
            await controller.navigateToSection('unknown-section');
            expect(mainLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Sección desconocida'));
        });
    });
});
