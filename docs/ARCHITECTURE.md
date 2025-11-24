# Arquitectura de MovieFinder v2.0

## Visión General

MovieFinder utiliza una arquitectura modular basada en el patrón MVC con las siguientes capas:
```
┌─────────────────────────────────────────────────┐
│               app.js (Entry Point)              │
└─────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│    Core      │ │Controllers│ │   Services   │
│              │ │           │ │              │
│ • State      │ │ • Movies  │ │ • TMDB API   │
│ • Router     │ │ • Search  │ │ • Storage    │
│ • EventBus   │ │ • Filters │ │ • Cache      │
└──────────────┘ └──────────┘ └──────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
                        ▼
                ┌──────────────┐
                │      UI      │
                │              │
                │ • Components │
                │ • Views      │
                └──────────────┘
```

## Estructura de Carpetas

### `/core` - Núcleo de la aplicación
- **State.js**: Gestión centralizada del estado con patrón Observer
- **Router.js**: Sistema de routing/navegación
- **EventBus.js**: Comunicación desacoplada entre módulos

### `/controllers` - Lógica de negocio
- **MoviesController.js**: Gestión de películas
- **SearchController.js**: Búsqueda inteligente
- **FiltersController.js**: Filtros y ordenamiento
- **FavoritesController.js**: Favoritos y vistas
- **RecommendationsController.js**: Recomendaciones

### `/services` - Acceso a datos
- **TMDBService.js**: API de TMDB
- **StorageService.js**: localStorage
- **CacheService.js**: Caché en memoria
- **FiltersService.js**: Lógica pura de filtrado

### `/ui` - Presentación
- **components/**: Componentes reutilizables (MovieCard, Modal, etc.)
- **views/**: Vistas de renderizado (MoviesView, ModalView, etc.)

### `/utils` - Utilidades
- **dom.js**: Helpers DOM
- **formatters.js**: Formateo
- **validators.js**: Validaciones

## Flujo de Datos
```
User Action → UI Component → Controller → Service → API/Storage
                                   ↓
                              State Update
                                   ↓
                            State Notification
                                   ↓
                              UI Re-render
```

## Principios de Diseño

1. **Separation of Concerns**: Cada módulo tiene una única responsabilidad
2. **Dependency Injection**: Controllers reciben dependencias en constructor
3. **Observer Pattern**: State notifica cambios a subscribers
4. **Single Source of Truth**: Todo el estado en State.js
5. **Immutability**: State nunca se muta directamente

## Estado de Migración

- [x] Estructura de carpetas creada
- [ ] Core implementado (Refactor #1)
- [ ] Services migrados (Refactor #2)
- [ ] Controllers implementados (Refactor #3-4)
- [ ] UI componentizada (Refactor #5)
- [ ] app.js final (Refactor #6)
- [ ] main.js legacy eliminado

## Próximos Pasos

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para guía de refactorización.
