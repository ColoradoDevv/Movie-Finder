import { FiltersController } from '../../js/controllers/FiltersController.js';
import { StateMock } from '../mocks/StateMock.js';

// Mock Logger
jest.mock('../../js/logger.js', () => {
    return class {
        info() { }
        debug() { }
    };
});

describe('FiltersController', () => {
    let controller;
    let mockState;

    beforeEach(() => {
        document.body.innerHTML = `
            <select id="sort-by"><option value="default">Default</option><option value="rating">Rating</option></select>
            <select id="filter-year"><option value="">Year</option><option value="2023">2023</option></select>
            <select id="filter-rating"><option value="">Rating</option><option value="8">8+</option></select>
            <button id="apply-filters"></button>
            <button id="reset-filters"></button>
        `;

        mockState = new StateMock();
        controller = new FiltersController(mockState);
        controller.init();
    });

    it('should capture current filters', () => {
        document.getElementById('sort-by').value = 'rating';
        document.getElementById('filter-year').value = '2023';
        document.getElementById('filter-rating').value = '8';

        const filters = controller.getCurrentFilters();

        expect(filters).toEqual({
            sortBy: 'rating',
            year: '2023',
            rating: '8'
        });
    });

    it('should update state when apply button clicked', () => {
        document.getElementById('sort-by').value = 'rating';
        document.getElementById('apply-filters').click();

        expect(mockState.get('filters')).toEqual({
            sortBy: 'rating',
            year: '',
            rating: ''
        });
    });

    it('should reset state when reset button clicked', () => {
        document.getElementById('sort-by').value = 'rating';
        document.getElementById('reset-filters').click();

        expect(mockState.get('filters')).toEqual({
            sortBy: 'default',
            year: '',
            rating: ''
        });
        expect(document.getElementById('sort-by').value).toBe('default');
    });
});
