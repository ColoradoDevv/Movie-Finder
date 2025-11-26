/**
 * @jest-environment jsdom
 */

import { Recommendation } from '../../js/ui/components/Recommendation.js';

describe('Recommendation Component', () => {
    let container;
    let recommendation;
    let mockMovie;

    beforeEach(() => {
        // Create container with required elements
        container = document.createElement('div');
        container.innerHTML = `
            <div id="recommended-movie">
                <img id="recommended-poster" alt="Poster">
                <h3 id="recommended-title"></h3>
                <p id="recommended-overview"></p>
                <span id="recommended-rating"></span>
                <span id="recommended-year"></span>
            </div>
        `;
        document.body.appendChild(container);

        // Create Recommendation instance
        recommendation = new Recommendation(container);

        // Mock movie data
        mockMovie = {
            id: 550,
            title: 'Fight Club',
            overview: 'A ticking-time-bomb insomniac...',
            vote_average: 8.4,
            release_date: '1999-10-15',
            poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg'
        };
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('Constructor', () => {
        test('should create Recommendation instance with valid container', () => {
            expect(recommendation.container).toBe(container);
        });

        test('should throw error if container is null', () => {
            expect(() => new Recommendation(null)).toThrow('Recommendation requiere un contenedor válido');
        });
    });

    describe('render()', () => {
        test('should render movie recommendation', () => {
            recommendation.render(mockMovie);

            const title = document.getElementById('recommended-title');
            expect(title.textContent).toBe('Fight Club');
        });

        test('should display movie overview', () => {
            recommendation.render(mockMovie);

            const overview = document.getElementById('recommended-overview');
            expect(overview.textContent).toBe('A ticking-time-bomb insomniac...');
        });

        test('should display vote average', () => {
            recommendation.render(mockMovie);

            const rating = document.getElementById('recommended-rating');
            expect(rating.textContent).toBe('8.4');
        });

        test('should display N/A for missing vote average', () => {
            const movieWithoutRating = { ...mockMovie, vote_average: 0 };
            recommendation.render(movieWithoutRating);

            const rating = document.getElementById('recommended-rating');
            expect(rating.textContent).toBe('N/A');
        });

        test('should display formatted year', () => {
            recommendation.render(mockMovie);

            const year = document.getElementById('recommended-year');
            expect(year.textContent).toContain('1999');
        });

        test('should set poster image src', () => {
            recommendation.render(mockMovie);

            const poster = document.getElementById('recommended-poster');
            expect(poster.src).toContain('pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg');
        });

        test('should handle missing movie gracefully', () => {
            expect(() => recommendation.render(null)).not.toThrow();
        });

        test('should show container after rendering', () => {
            recommendation.render(mockMovie);

            const recommendedMovie = document.getElementById('recommended-movie');
            expect(recommendedMovie.classList.contains('show')).toBe(true);
        });
    });

    describe('show()', () => {
        test('should show recommendation container', () => {
            recommendation.show();

            const recommendedMovie = document.getElementById('recommended-movie');
            expect(recommendedMovie.classList.contains('show')).toBe(true);
        });
    });

    describe('hide()', () => {
        test('should hide recommendation container', () => {
            recommendation.show();
            recommendation.hide();

            const recommendedMovie = document.getElementById('recommended-movie');
            expect(recommendedMovie.classList.contains('show')).toBe(false);
        });
    });
});
