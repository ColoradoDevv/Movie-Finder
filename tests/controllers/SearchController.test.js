import { SearchController } from '../../js/controllers/SearchController.js';
import { TMDBService } from '../../js/services/TMDBService.js';
import { MoviesView } from '../../js/ui/views/MoviesView.js';
import { EmptyStateView } from '../../js/ui/views/EmptyStateView.js';
import * as utils from '../../js/utils.js';

// Mock dependencies
jest.mock('../../js/services/TMDBService.js', () => ({
    TMDBService: {
        multiSearch: jest.fn(),
        getMoviesByPerson: jest.fn()
    }
}));

jest.mock('../../js/ui/views/MoviesView.js');
jest.mock('../../js/ui/views/EmptyStateView.js');

jest.mock('../../js/utils.js', () => ({
    clearResults: jest.fn(),
    sectionTitle: { textContent: '', innerHTML: '' },
    resultsGrid: { querySelectorAll: jest.fn().mockReturnValue([]) }
}));

jest.mock('../../js/logger.js');

describe('SearchController', () => {
    let controller;
    let mockMoviesView;
    let mockEmptyStateView;

    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '<div id="results-grid"></div>';

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

        controller = new SearchController();
    });

    describe('Intelligent Search', () => {
        it('should detect movie search type', async () => {
            TMDBService.multiSearch.mockResolvedValue({
                movies: [{ id: 1 }],
                people: [],
                total_results: 1,
                total_pages: 1
            });

            const result = await controller.intelligentSearch('movie query');

            expect(result.searchType).toBe('movie');
            expect(result.movies.length).toBe(1);
        });

        it('should detect person search type', async () => {
            TMDBService.multiSearch.mockResolvedValue({
                movies: [],
                people: [{ id: 1 }],
                total_results: 1,
                total_pages: 1
            });

            const result = await controller.intelligentSearch('person query');

            expect(result.searchType).toBe('person');
        });

        it('should detect mixed search type', async () => {
            TMDBService.multiSearch.mockResolvedValue({
                movies: [{ id: 1 }],
                people: [{ id: 1 }],
                total_results: 2,
                total_pages: 1
            });

            const result = await controller.intelligentSearch('mixed query');

            expect(result.searchType).toBe('mixed');
        });

        it('should return null on error', async () => {
            TMDBService.multiSearch.mockRejectedValue(new Error('Network error'));
            const result = await controller.intelligentSearch('error');
            expect(result).toBeNull();
        });
    });

    describe('Process Search Results', () => {
        it('should display movies for movie search type', async () => {
            const results = {
                searchType: 'movie',
                movies: [{ id: 1, title: 'Movie 1' }],
                people: []
            };

            await controller.processSearchResults(results, 'query');

            expect(mockMoviesView.render).toHaveBeenCalledWith(results.movies);
            expect(utils.sectionTitle.textContent).toContain('Películas');
        });

        it('should handle person search type', async () => {
            const results = {
                searchType: 'person',
                movies: [],
                people: [{ id: 1, name: 'Actor 1' }]
            };

            TMDBService.getMoviesByPerson.mockResolvedValue({
                cast: [{ id: 101, title: 'Movie 101', popularity: 10 }]
            });

            await controller.processSearchResults(results, 'query');

            expect(mockMoviesView.render).toHaveBeenCalled();
            expect(utils.sectionTitle.innerHTML).toContain('Actor 1');
        });

        it('should handle mixed search type', async () => {
            const results = {
                searchType: 'mixed',
                movies: [{ id: 1, title: 'Movie 1' }],
                people: [{ id: 2, name: 'Actor 1' }]
            };

            await controller.processSearchResults(results, 'query');

            expect(mockMoviesView.render).toHaveBeenCalledWith(results.movies);
            // Verify suggestions are added
            const grid = document.getElementById('results-grid');
            expect(grid.innerHTML).toContain('person-suggestions');
        });
    });
});
