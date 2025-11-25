import Logger from '../logger.js';

export class FiltersController {
    constructor() {
        this.logger = new Logger('FILTERS_CONTROLLER');
        this.dom = {
            sortBySelect: document.getElementById('sort-by'),
            filterYearSelect: document.getElementById('filter-year'),
            filterRatingSelect: document.getElementById('filter-rating'),
            applyFiltersBtn: document.getElementById('apply-filters'),
            resetFiltersBtn: document.getElementById('reset-filters')
        };
        this.logger.info('🔍 FiltersController inicializado');
    }

    /**
     * Inicializa los event listeners para los filtros
     * @param {Function} onApplyFilters - Callback para aplicar filtros (recibe objeto de filtros)
     * @param {Function} onResetFilters - Callback para resetear filtros
     */
    init(onApplyFilters, onResetFilters) {
        if (this.dom.applyFiltersBtn) {
            this.dom.applyFiltersBtn.addEventListener('click', () => {
                this.logger.info('🔍 Aplicando filtros...');
                const filters = this.getCurrentFilters();
                this.logger.debug('Filtros capturados:', filters);

                if (typeof onApplyFilters === 'function') {
                    onApplyFilters(filters);
                }
            });
        }

        if (this.dom.resetFiltersBtn) {
            this.dom.resetFiltersBtn.addEventListener('click', () => {
                this.logger.info('🔄 Reseteando filtros...');
                this.resetForm();

                if (typeof onResetFilters === 'function') {
                    onResetFilters();
                }
            });
        }
    }

    /**
     * Obtiene los valores actuales de los filtros
     * @returns {Object} Filtros actuales
     */
    getCurrentFilters() {
        return {
            sortBy: this.dom.sortBySelect ? this.dom.sortBySelect.value : 'default',
            year: this.dom.filterYearSelect ? this.dom.filterYearSelect.value : '',
            rating: this.dom.filterRatingSelect ? this.dom.filterRatingSelect.value : ''
        };
    }

    /**
     * Resetea el formulario de filtros a sus valores por defecto
     */
    resetForm() {
        if (this.dom.sortBySelect) this.dom.sortBySelect.value = 'default';
        if (this.dom.filterYearSelect) this.dom.filterYearSelect.value = '';
        if (this.dom.filterRatingSelect) this.dom.filterRatingSelect.value = '';
    }
}