/**
 * @jest-environment jsdom
 */

import { MovieCard } from '../../js/ui/components/MovieCard.js';
import { StorageService } from '../../js/services/StorageService.js';

// Mock StorageService
jest.mock('../../js/services/StorageService.js');

describe('MovieCard Component', () => {
    let mockMovie;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock movie data
        mockMovie = {
            id: 550,
            title: 'Fight Club',
            vote_average: 8.4,
            release_date: '1999-10-15',
            poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
            overview: 'A ticking-time-bomb insomniac...'
        };

        // Mock StorageService methods
        StorageService.isFavorite = jest.fn().mockReturnValue(false);
        StorageService.isWatched = jest.fn().mockReturnValue(false);
    });

    describe('Constructor', () => {
        test('should create MovieCard instance with valid movie data', () => {
            const card = new MovieCard(mockMovie);
            expect(card.movie).toEqual(mockMovie);
        });

        test('should throw error if movie is null', () => {
            expect(() => new MovieCard(null)).toThrow('MovieCard requiere un objeto movie válido con id');
        });

        test('should throw error if movie has no id', () => {
            const invalidMovie = { title: 'Test' };
            expect(() => new MovieCard(invalidMovie)).toThrow('MovieCard requiere un objeto movie válido con id');
        });
    });

    describe('render()', () => {
        test('should render movie card with correct structure', () => {
            const card = new MovieCard(mockMovie);
            const element = card.render();

            expect(element).toBeInstanceOf(HTMLElement);
            expect(element.className).toBe('movie-card');
            expect(element.dataset.movieId).toBe('550');
        });

        test('should display movie title', () => {
            const card = new MovieCard(mockMovie);
            const element = card.render();
            const title = element.querySelector('h3');

            expect(title).toBeTruthy();
            expect(title.textContent).toBe('Fight Club');
        });

        test('should display vote average', () => {
            const card = new MovieCard(mockMovie);
            const element = card.render();
            const info = element.querySelector('.movie-info p');

            expect(info.textContent).toContain('8.4');
        });

        test('should display N/A for missing vote average', () => {
            const movieWithoutRating = { ...mockMovie, vote_average: 0 };
            const card = new MovieCard(movieWithoutRating);
            const element = card.render();
            const info = element.querySelector('.movie-info p');

            expect(info.textContent).toContain('N/A');
        });

        test('should display formatted release date', () => {
            const card = new MovieCard(mockMovie);
            const element = card.render();
            const info = element.querySelector('.movie-info p');

            expect(info.textContent).toContain('1999');
        });

        test('should render poster image', () => {
            const card = new MovieCard(mockMovie);
            const element = card.render();
            const img = element.querySelector('img');

            expect(img).toBeTruthy();
            expect(img.alt).toBe('Fight Club');
            expect(img.loading).toBe('lazy');
        });

        test('should show favorite mark when movie is favorite', () => {
            StorageService.isFavorite.mockReturnValue(true);

            const card = new MovieCard(mockMovie);
            const element = card.render();
            const favoriteIcon = element.querySelector('.movie-status');

            expect(favoriteIcon).toBeTruthy();
            expect(StorageService.isFavorite).toHaveBeenCalledWith(550);
        });

        test('should show watched mark when movie is watched', () => {
            StorageService.isWatched.mockReturnValue(true);

            const card = new MovieCard(mockMovie);
            const element = card.render();
            const watchedIcon = element.querySelector('.movie-status');

            expect(watchedIcon).toBeTruthy();
            expect(StorageService.isWatched).toHaveBeenCalledWith(550);
        });

        test('should handle missing title gracefully', () => {
            const movieWithoutTitle = { ...mockMovie, title: null };
            const card = new MovieCard(movieWithoutTitle);
            const element = card.render();
            const title = element.querySelector('h3');

            expect(title.textContent).toBe('Sin título');
        });
    });

    describe('update()', () => {
        test('should update movie data', () => {
            const card = new MovieCard(mockMovie);
            const newMovie = { ...mockMovie, title: 'Updated Title' };

            card.update(newMovie);

            expect(card.movie.title).toBe('Updated Title');
        });

        test('should not update with invalid movie data', () => {
            const card = new MovieCard(mockMovie);
            const originalMovie = card.movie;

            card.update(null);

            expect(card.movie).toEqual(originalMovie);
        });
    });
});
