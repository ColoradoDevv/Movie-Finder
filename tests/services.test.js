import { jest } from '@jest/globals';
import { TMDBService } from '../js/services/TMDBService.js';
import { StorageService } from '../js/services/StorageService.js';
import { FiltersService } from '../js/services/FiltersService.js';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (function () {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: jest.fn(key => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('TMDBService', () => {
    beforeEach(() => {
        fetch.mockClear();
        TMDBService.clearCache();
    });

    test('fetchFromAPI makes a request to the correct URL', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ results: [] })
        });

        await TMDBService.fetchFromAPI('movie/popular');

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('movie/popular'));
    });

    test('fetchFromAPI handles errors', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            statusText: 'Not Found'
        });

        const result = await TMDBService.fetchFromAPI('movie/unknown');
        expect(result).toBeNull();
    });
});

describe('StorageService', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    test('addToFavorites adds a movie to favorites', () => {
        const movie = { id: 1, title: 'Test Movie' };
        const result = StorageService.addToFavorites(movie);

        expect(result).toBe(true);
        expect(localStorage.setItem).toHaveBeenCalledWith('movieFavorites', expect.stringContaining('Test Movie'));
    });

    test('addToFavorites prevents duplicates', () => {
        const movie = { id: 1, title: 'Test Movie' };
        StorageService.addToFavorites(movie);
        const result = StorageService.addToFavorites(movie);

        expect(result).toBe(false);
    });

    test('isFavorite returns correct status', () => {
        const movie = { id: 1, title: 'Test Movie' };
        StorageService.addToFavorites(movie);

        expect(StorageService.isFavorite(1)).toBe(true);
        expect(StorageService.isFavorite(2)).toBe(false);
    });
});

describe('FiltersService', () => {
    const movies = [
        { id: 1, title: 'A Movie', release_date: '2023-01-01', vote_average: 8.0, popularity: 100 },
        { id: 2, title: 'B Movie', release_date: '2022-01-01', vote_average: 6.0, popularity: 50 },
        { id: 3, title: 'C Movie', release_date: '2023-05-01', vote_average: 9.0, popularity: 200 }
    ];

    test('filterByYear filters correctly', () => {
        const result = FiltersService.filterByYear(movies, '2022');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(2);
    });

    test('filterByRating filters correctly', () => {
        const result = FiltersService.filterByRating(movies, '7');
        expect(result).toHaveLength(2);
        expect(result.map(m => m.id)).toContain(1);
        expect(result.map(m => m.id)).toContain(3);
    });

    test('sortMovies sorts by rating descending', () => {
        const result = FiltersService.sortMovies(movies, 'rating-desc');
        expect(result[0].id).toBe(3);
        expect(result[1].id).toBe(1);
        expect(result[2].id).toBe(2);
    });
});
