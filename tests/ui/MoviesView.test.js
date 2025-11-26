/**
 * @jest-environment jsdom
 */

import { MoviesView } from '../../js/ui/views/MoviesView.js';
import { MovieCard } from '../../js/ui/components/MovieCard.js';

// Mock MovieCard
jest.mock('../../js/ui/components/MovieCard.js');

describe('MoviesView', () => {
    let container;
    let moviesView;
    let mockMovies;

    beforeEach(() => {
        // Create container
        container = document.createElement('div');
        container.id = 'results-grid';
        document.body.appendChild(container);

        // Create MoviesView instance
        moviesView = new MoviesView(container);

        // Mock movies data
        mockMovies = [
            { id: 1, title: 'Movie 1', vote_average: 8.0, release_date: '2023-01-01', poster_path: '/test1.jpg' },
            { id: 2, title: 'Movie 2', vote_average: 7.5, release_date: '2023-02-01', poster_path: '/test2.jpg' },
            { id: 3, title: 'Movie 3', vote_average: 9.0, release_date: '2023-03-01', poster_path: '/test3.jpg' }
        ];

        // Mock MovieCard
        MovieCard.mockImplementation((movie) => ({
            movie,
            render: jest.fn(() => {
                const div = document.createElement('div');
                div.className = 'movie-card';
                div.dataset.movieId = movie.id;
                return div;
            })
        }));
    });

    afterEach(() => {
        document.body.removeChild(container);
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        test('should create MoviesView instance with valid container', () => {
            expect(moviesView.container).toBe(container);
        });

        test('should throw error if container is null', () => {
            expect(() => new MoviesView(null)).toThrow('MoviesView requiere un contenedor válido');
        });
    });

    describe('render()', () => {
        test('should render all movies', () => {
            moviesView.render(mockMovies);

            expect(MovieCard).toHaveBeenCalledTimes(3);
            expect(container.children.length).toBe(3);
        });

        test('should create MovieCard for each movie', () => {
            moviesView.render(mockMovies);

            mockMovies.forEach((movie, index) => {
                expect(MovieCard).toHaveBeenNthCalledWith(index + 1, movie);
            });
        });

        test('should not render if movies array is empty', () => {
            moviesView.render([]);

            expect(MovieCard).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });

        test('should not render if movies is not an array', () => {
            moviesView.render(null);

            expect(MovieCard).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });

        test('should handle errors gracefully when MovieCard fails', () => {
            MovieCard.mockImplementationOnce(() => {
                throw new Error('Test error');
            });

            expect(() => moviesView.render(mockMovies)).not.toThrow();
        });
    });

    describe('append()', () => {
        test('should append movies to existing content', () => {
            // First render
            moviesView.render(mockMovies.slice(0, 2));
            expect(container.children.length).toBe(2);

            // Append more
            moviesView.append([mockMovies[2]]);
            expect(container.children.length).toBe(3);
        });

        test('should not append if movies array is empty', () => {
            moviesView.render(mockMovies);
            const initialCount = container.children.length;

            moviesView.append([]);

            expect(container.children.length).toBe(initialCount);
        });
    });

    describe('clear()', () => {
        test('should clear all movies from container', () => {
            moviesView.render(mockMovies);
            expect(container.children.length).toBe(3);

            moviesView.clear();

            expect(container.innerHTML).toBe('');
            expect(container.children.length).toBe(0);
        });

        test('should handle clearing empty container', () => {
            expect(() => moviesView.clear()).not.toThrow();
            expect(container.innerHTML).toBe('');
        });
    });
});
