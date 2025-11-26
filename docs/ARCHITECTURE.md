# Arquitectura de MovieFinder v2.0

## Visión General

MovieFinder utiliza una arquitectura modular basada en el patrón MVC con las siguientes capas:
```
┌─────────────────────────────────────────────────┐
│          app.js (Entry Point - 50 líneas)       │
│  ├─ AppInitializer (Inicialización)             │
│  └─ EventHandlers (Event Listeners)             │
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
│ • EventBus   │ │ • Filters │ │ • Filters    │
│              │ │ • Favorites│ │              │
│              │ │ • Recommend│ │              │
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

```
js/
├── app.js                    # Punto de entrada (50 líneas)
├── AppInitializer.js         # Inicialización de la app
├── EventHandlers.js          # Gestión de eventos
├── core/                     # Núcleo
│   ├── State.js             # Gestión de estado
│   ├── Router.js            # Routing
│   └── EventBus.js          # Pub/Sub
├── controllers/              # Lógica de negocio
│   ├── MoviesController.js
│   ├── SearchController.js
│   ├── FiltersController.js
│   ├── FavoritesController.js
│   └── RecommendationsController.js
├── services/                 # Acceso a datos
│   ├── TMDBService.js       # API de TMDB
│   ├── StorageService.js    # localStorage
│   └── FiltersService.js    # Lógica de filtrado
├── ui/                       # Presentación
│   ├── components/          # Componentes reutilizables
│   │   ├── MovieCard.js
│   │   ├── Modal.js
│   │   └── Recommendation.js
│   └── views/               # Vistas de renderizado
│       ├── MoviesView.js
│       ├── ModalView.js
│       └── EmptyStateView.js
├── utils.js                  # Utilidades DOM
├── logger.js                 # Sistema de logging
└── mobile-nav.js             # Navegación móvil
```

## Flujo de Datos
```
User Action → EventHandlers → Controller → Service → API/Storage
                                   ↓
                            State Update
                                   ↓
                          State Notification
                                   ↓
                            UI Re-render
```

## Principios de Diseño

1. **Separation of Concerns**: Cada módulo tiene una única responsabilidad
2. **Dependency Injection**: Controllers reciben dependencias
3. **Observer Pattern**: State notifica cambios a subscribers
4. **Single Source of Truth**: Estado centralizado
5. **Modular Architecture**: Código organizado en módulos ES6

## Estado Actual

- ✅ Estructura de carpetas creada
- ✅ Core implementado (State, Router, EventBus)
- ✅ Services migrados (TMDB, Storage, Filters)
- ✅ Controllers implementados (5 controladores)
- ✅ UI componentizada (3 componentes, 3 vistas)
- ✅ app.js final (50 líneas)
- ✅ Archivos legacy eliminados

## Métricas

- **Tests**: 136/136 pasando ✅
- **Cobertura**: ~85%
- **Arquitectura**: 100% modular
- **Líneas en app.js**: 50 (reducción del 83%)

