import { FiltersController } from '../../js/controllers/FiltersController.js';

// Mock Logger
jest.mock('../../js/logger.js', () => {
    return function () {
        return {
            info: jest.fn(),
            debug: jest.fn()
        };
    };
});

describe('FiltersController', () => {
    let controller;
    let onApplyMock;
    let onResetMock;

    beforeEach(() => {
        document.body.innerHTML = `
            <select id="sort-by"><option value="default">Default</option><option value="rating">Rating</option></select>
            <select id="filter-year"><option value="">Year</option><option value="2023">2023</option></select>
            <select id="filter-rating"><option value="">Rating</option><option value="8">8+</option></select>
            <button id="apply-filters"></button>
            <button id="reset-filters"></button>
        `;

        controller = new FiltersController();
        onApplyMock = jest.fn();
        onResetMock = jest.fn();
        controller.init(onApplyMock, onResetMock);
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

    it('should call onApply callback when apply button clicked', () => {
        document.getElementById('sort-by').value = 'rating';
        document.getElementById('apply-filters').click();

        expect(onApplyMock).toHaveBeenCalledWith({
            sortBy: 'rating',
            year: '',
            rating: ''
        });
    });

    it('should call onReset callback when reset button clicked', () => {
        document.getElementById('sort-by').value = 'rating';
        document.getElementById('reset-filters').click();

        expect(onResetMock).toHaveBeenCalled();
        expect(document.getElementById('sort-by').value).toBe('default');
    });
});
