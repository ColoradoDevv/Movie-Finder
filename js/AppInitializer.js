import { StorageService } from './services/StorageService.js';
import { MoviesView } from './ui/views/MoviesView.js';
import { EmptyStateView } from './ui/views/EmptyStateView.js';
import { ModalView } from './ui/views/ModalView.js';
import { clearResults, resultsGrid } from './utils.js';
import { mainLogger } from './logger.js';

import { MoviesController } from './controllers/MoviesController.js';
import { SearchController } from './controllers/SearchController.js';
import { FiltersController } from './controllers/FiltersController.js';
import { FavoritesController } from './controllers/FavoritesController.js';
import { RecommendationsController } from './controllers/RecommendationsController.js';

/**
 * AppInitializer
 * Módulo encargado de inicializar todos los controladores, vistas y configuraciones
 */
export class AppInitializer {
    constructor() {
        this.controllers = null;
        this.views = null;
    }

    /**
     * Inicializa todos los controladores
     */
    initializeControllers() {
        mainLogger.info('🎮 Inicializando controladores...');

        this.controllers = {
            movies: new MoviesController(),
            search: new SearchController(),
            filters: new FiltersController(),
            favorites: new FavoritesController(),
            recommendations: new RecommendationsController()
        };

        return this.controllers;
    }

    /**
     * Inicializa todas las vistas
     */
    initializeViews() {
        mainLogger.info('🎨 Inicializando vistas...');

        this.views = {
            modal: new ModalView(),
            movies: new MoviesView(resultsGrid),
            empty: new EmptyStateView(resultsGrid)
        };

        return this.views;
    }

    /**
     * Configura los filtros con sus callbacks
     */
    setupFilters(controllers, views) {
        mainLogger.info('🔧 Configurando filtros...');

        const { movies: moviesController } = controllers;
        const { movies: moviesView } = views;

        controllers.filters.init(
            (filters) => { // onApply
                moviesController.state.currentFilters = filters;
                mainLogger.debug('Filtros aplicados:', filters);

                if (moviesController.state.allMoviesCache.length > 0) {
                    const filteredMovies = moviesController.applyFiltersToMovies(moviesController.state.allMoviesCache);
                    clearResults();
                    moviesView.render(filteredMovies);
                    moviesController.updateResultsCount(filteredMovies.length, moviesController.state.allMoviesCache.length);
                    mainLogger.success(`✓ Filtros aplicados: ${filteredMovies.length} resultados`);
                }
            },
            () => { // onReset
                moviesController.state.currentFilters = {
                    sortBy: 'default',
                    year: '',
                    rating: ''
                };

                if (moviesController.state.allMoviesCache.length > 0) {
                    clearResults();
                    moviesView.render(moviesController.state.allMoviesCache);
                    moviesController.updateResultsCount(moviesController.state.allMoviesCache.length, moviesController.state.allMoviesCache.length);
                }
                mainLogger.success('✓ Filtros reseteados');
            }
        );

        controllers.favorites.init();
        controllers.recommendations.init();
    }

    /**
     * Inicializa la aplicación completa
     */
    async initializeApp(controllers, views) {
        try {
            mainLogger.info('🎬 Inicializando MovieFinder...');
            mainLogger.time('Inicialización completa');

            await controllers.movies.init();

            mainLogger.timeEnd('Inicialización completa');
            mainLogger.success('✅ MovieFinder inicializado correctamente');

            // Log de bienvenida
            mainLogger.group('🎉 Bienvenido a MovieFinder');
            mainLogger.info('Películas populares cargadas');
            mainLogger.info(`${StorageService.getFavorites().length} favoritos guardados`);
            mainLogger.info(`${StorageService.getWatchedMovies().length} películas vistas`);
            mainLogger.groupEnd();

        } catch (error) {
            mainLogger.error('❌ Error fatal al inicializar la aplicación:', error);
            views.empty.show('⚠️ Error fatal al inicializar la aplicación');
            mainLogger.timeEnd('Inicialización completa');
        }
    }
}
