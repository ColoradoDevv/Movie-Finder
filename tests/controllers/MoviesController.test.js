import { MoviesController } from '../../js/controllers/MoviesController.js';
import { mainLogger } from '../../js/logger.js';
import { TMDBService } from '../../js/services/TMDBService.js';
import { StorageService } from '../../js/services/StorageService.js';
import { FiltersService } from '../../js/services/FiltersService.js';
import * as ui from '../../js/ui.js';
import * as utils from '../../js/utils.js';
import * as mobileNav from '../../js/mobile-nav.js';

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
jest.mock('../../js/ui.js', () => ({
    displayMovies: jest.fn()
}));
jest.mock('../../js/utils.js', () => ({
    showLoader: jest.fn(),
    hideLoader: jest.fn(),
    clearResults: jest.fn(),
    showEmptyMessage: jest.fn(),
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

        controller = new MoviesController();

        // Inject DOM elements into controller if needed, but controller uses imports.
        // We rely on the mocks defined at the top.
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
            expect(mobileNav.updateNavigationBadges).toHaveBeenCalled();
        });
    });

    describe('Navigation', () => {
        it('should navigate to popular', async () => {
            const spy = jest.spyOn(controller, 'loadPopularMovies').mockImplementation();
            await controller.navigateToSection('popular');
            expect(spy).toHaveBeenCalled();
            expect(mobileNav.syncNavigationState).toHaveBeenCalledWith('popular');
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

        it('should navigate to favorites', async () => {
            const spy = jest.spyOn(controller, 'displayFavorites').mockImplementation();
            await controller.navigateToSection('favorites');
            expect(spy).toHaveBeenCalled();
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
            expect(utils.clearResults).toHaveBeenCalled();
            expect(ui.displayMovies).toHaveBeenCalledWith(mockMovies);
            expect(controller.state.currentPage).toBe(1);
            expect(controller.state.totalPages).toBe(5);
        });

        it('should handle error when loading movies', async () => {
            TMDBService.getMovies.mockRejectedValue(new Error('Network error'));

            await controller.loadPopularMovies();

            expect(utils.hideLoader).toHaveBeenCalled();
            expect(utils.showEmptyMessage).toHaveBeenCalledWith(expect.stringContaining('Error de conexión'));
        });

        it('should load movies by genre', async () => {
            const mockMovies = [{ id: 1, title: 'Genre Movie' }];
            TMDBService.getMovies.mockResolvedValue({ results: mockMovies, total_pages: 1 });

            await controller.loadMoviesByGenre('28', 'Action');

            expect(controller.state.currentSection).toBe('genre');
            expect(utils.sectionTitle.textContent).toBe('Action');
            expect(TMDBService.getMovies).toHaveBeenCalledWith(expect.stringContaining('with_genres=28'), 1);
        });
    });

    describe('Pagination', () => {
        it('should load more movies', async () => {
            // Setup initial state
            controller.state.currentPage = 1;
            controller.state.totalPages = 5;
            controller.state.currentEndpoint = 'movie/popular';
            controller.state.allMoviesCache = [{ id: 1 }];

            const newMovies = [{ id: 2 }];
            TMDBService.getMovies.mockResolvedValue({ results: newMovies, page: 2, total_pages: 5 });
            FiltersService.applyFilters.mockImplementation(movies => movies);

            await controller.loadMore();

            expect(TMDBService.getMovies).toHaveBeenCalledWith('movie/popular', 2);
            expect(controller.state.allMoviesCache.length).toBe(2);
            expect(ui.displayMovies).toHaveBeenCalled();
            expect(controller.state.currentPage).toBe(2);
        });

        it('should not load more if on last page', async () => {
            controller.state.currentPage = 5;
            controller.state.totalPages = 5;

            await controller.loadMore();

            expect(TMDBService.getMovies).not.toHaveBeenCalled();
        });
    });

    describe('User Lists', () => {
        it('should display favorites', () => {
            const favorites = [{ id: 1, title: 'Fav Movie' }];
            StorageService.getFavorites.mockReturnValue(favorites);

            controller.displayFavorites();

            expect(controller.state.currentSection).toBe('favorites');
            expect(utils.sectionTitle.textContent).toBe('Mis favoritos');
            expect(ui.displayMovies).toHaveBeenCalledWith(favorites);
        });

        it('should show empty message if no favorites', () => {
            StorageService.getFavorites.mockReturnValue([]);

            controller.displayFavorites();

            expect(utils.showEmptyMessage).toHaveBeenCalledWith(expect.stringContaining('Aún no tienes películas'));
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
            expect(ui.displayMovies).toHaveBeenCalledWith([
                { id: 1, title: 'Christmas Carol' },
                { id: 3, title: 'Navidad en la ciudad' }
            ]);
        });
    });

    describe('Pagination Edge Cases', () => {
        it('should not call TMDBService when already on last page', async () => {
            controller.state.currentPage = 3;
            controller.state.totalPages = 3;
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

            expect(ui.displayMovies).toHaveBeenCalledWith(genericMovies);
            expect(mainLogger.success).toHaveBeenCalledWith(expect.stringContaining('películas relacionadas cargadas'));
        });

        it('should handle empty results gracefully', async () => {
            TMDBService.getMovies.mockResolvedValue({ results: [], total_pages: 1 });

            await controller.loadChristmasMovies();

            expect(utils.showEmptyMessage).toHaveBeenCalledWith(expect.stringContaining('No se encontraron películas navideñas'));
        });
    });

    describe('Update Grid DOM Updates', () => {
        it('should update badges on existing cards', () => {
            // Setup DOM with a movie card
            document.body.innerHTML += `
            <div id="results-grid">
                <div class="movie-card" data-movie-id="101">
                    <div class="movie-info"></div>
                </div>
            </div>
        `;

            const mockCard = document.createElement('div');
            mockCard.className = 'movie-card';
            mockCard.dataset.movieId = '101';

            utils.resultsGrid.querySelectorAll.mockReturnValue([mockCard]);

            StorageService.isFavorite.mockReturnValue(true);
            StorageService.isWatched.mockReturnValue(true);
            StorageService.getFavorites.mockReturnValue([{ id: 101 }]);
            StorageService.getWatchedMovies.mockReturnValue([{ id: 101 }]);

            controller.updateGrid();

            expect(mockCard.querySelectorAll('.movie-status').length).toBe(2);
        });
    });

    describe('Load More Filtering', () => {
        it('should filter out non-movie media types', async () => {
            controller.state.currentPage = 1;
            controller.state.totalPages = 5;
            controller.state.allMoviesCache = [];

            const mixedResults = [
                { id: 1, title: 'Movie 1', media_type: 'movie' },
                { id: 2, name: 'Person 1', media_type: 'person' },
                { id: 3, title: 'Movie 2' } // implicit movie
            ];

            TMDBService.getMovies.mockResolvedValue({ results: mixedResults, page: 2, total_pages: 5 });
            FiltersService.applyFilters.mockImplementation(m => m);

            await controller.loadMore();

            expect(controller.state.allMoviesCache.length).toBe(2);
            expect(controller.state.allMoviesCache.find(m => m.id === 2)).toBeUndefined();
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

    describe('Update Grid Behavior', () => {
        it('should delegate to displayFavorites when currentSection is favorites', () => {
            const spy = jest.spyOn(controller, 'displayFavorites').mockImplementation();
            controller.state.currentSection = 'favorites';
            controller.updateGrid();
            expect(spy).toHaveBeenCalled();
        });
        it('should delegate to displayHistory when currentSection is history', () => {
            const spy = jest.spyOn(controller, 'displayHistory').mockImplementation();
            controller.state.currentSection = 'history';
            controller.updateGrid();
            expect(spy).toHaveBeenCalled();
        });
    });
});
