import { mainLogger } from './logger.js';
import { initializeMobileNavigation } from './mobile-nav.js';
import { AppInitializer } from './AppInitializer.js';
import { EventHandlers } from './EventHandlers.js';

mainLogger.info('🚀 MovieFinder iniciando...');

// ============================================
// INICIALIZACIÓN
// ============================================

const initializer = new AppInitializer();

// Inicializar controladores y vistas
const controllers = initializer.initializeControllers();
const views = initializer.initializeViews();

// Configurar filtros
initializer.setupFilters(controllers, views);

// Configurar event handlers
const eventHandlers = new EventHandlers(
    {
        movies: controllers.movies,
        search: controllers.search,
        favorites: controllers.favorites
    },
    views
);

eventHandlers.init();

// ============================================
// INICIO DE LA APLICACIÓN
// ============================================

async function startApp() {
    await initializer.initializeApp(controllers, views);
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        startApp();
        initializeMobileNavigation();
    });
} else {
    startApp();
    initializeMobileNavigation();
}