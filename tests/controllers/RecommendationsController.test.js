import { RecommendationsController } from '../../js/controllers/RecommendationsController.js';
import { TMDBService } from '../../js/services/TMDBService.js';
import { Recommendation } from '../../js/ui/components/Recommendation.js';
import { ModalView } from '../../js/ui/views/ModalView.js';
import * as utils from '../../js/utils.js';

// Mock dependencies
jest.mock('../../js/services/TMDBService.js', () => ({
    TMDBService: {
        fetchFromAPI: jest.fn(),
        getMovieDetails: jest.fn()
    }
}));

jest.mock('../../js/ui/components/Recommendation.js');
jest.mock('../../js/ui/views/ModalView.js');

jest.mock('../../js/utils.js', () => ({
    showLoader: jest.fn(),
    hideLoader: jest.fn()
}));

jest.mock('../../js/logger.js');

describe('RecommendationsController', () => {
    let controller;
    let mockRecommendation;
    let mockModalView;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();

        document.body.innerHTML = `
            <button id="recommend-button"></button>
            <select id="recommendation-genre">
                <option value="">Cualquier género</option>
                <option value="28">Action</option>
            </select>
            <button id="view-recommended-details"></button>
            <div id="recommended-movie-container"></div>
            <div id="movie-modal"></div>
        `;

        // Setup mocks for views
        mockRecommendation = {
            render: jest.fn(),
            show: jest.fn(),
            hide: jest.fn()
        };
        mockModalView = {
            showMovieDetails: jest.fn()
        };

        Recommendation.mockImplementation(() => mockRecommendation);
        ModalView.mockImplementation(() => mockModalView);

        controller = new RecommendationsController();
        controller.init();
    });

    describe('Get Random Movie', () => {
        it('should fetch and display a random movie', async () => {
            const mockMovies = [
                { id: 1, title: 'Movie 1' },
                { id: 2, title: 'Movie 2' }
            ];
            TMDBService.fetchFromAPI.mockResolvedValue({ results: mockMovies });

            await controller.getRandomMovie();

            expect(utils.showLoader).toHaveBeenCalled();
            expect(TMDBService.fetchFromAPI).toHaveBeenCalled();
            expect(utils.hideLoader).toHaveBeenCalled();
            expect(mockRecommendation.render).toHaveBeenCalled();
            expect(controller.history).toContain(controller.currentRecommendedMovie.id);
        });

        it('should filter out previously recommended movies', async () => {
            controller.history = [1]; // Movie 1 already seen
            const mockMovies = [
                { id: 1, title: 'Movie 1' },
                { id: 2, title: 'Movie 2' }
            ];
            TMDBService.fetchFromAPI.mockResolvedValue({ results: mockMovies });

            await controller.getRandomMovie();

            expect(controller.currentRecommendedMovie.id).toBe(2);
        });

        it('should reset history if all movies seen', async () => {
            controller.history = [1, 2];
            const mockMovies = [
                { id: 1, title: 'Movie 1' },
                { id: 2, title: 'Movie 2' }
            ];
            TMDBService.fetchFromAPI.mockResolvedValue({ results: mockMovies });

            await controller.getRandomMovie();

            expect(controller.history.length).toBeLessThan(3); // Should have reset and added one
        });
    });

    describe('View Details', () => {
        it('should open modal with movie details', async () => {
            controller.currentRecommendedMovie = { id: 1 };
            TMDBService.getMovieDetails.mockResolvedValue({ id: 1, title: 'Details' });

            document.getElementById('view-recommended-details').click();

            // Wait for async handler
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(TMDBService.getMovieDetails).toHaveBeenCalledWith(1);
            expect(mockModalView.showMovieDetails).toHaveBeenCalled();
        });

        it('should not open modal if no current movie', () => {
            controller.currentRecommendedMovie = null;
            document.getElementById('view-recommended-details').click();
            expect(TMDBService.getMovieDetails).not.toHaveBeenCalled();
        });
    });

    describe('Reset History', () => {
        it('should clear history when genre changes', () => {
            controller.history = [1, 2, 3];
            const select = document.getElementById('recommendation-genre');
            select.value = '28';
            select.dispatchEvent(new Event('change'));

            expect(controller.history.length).toBe(0);
        });
    });
});
