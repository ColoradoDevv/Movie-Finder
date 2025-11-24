# Plan de Refactorización MovieFinder

## Objetivo

Migrar de arquitectura monolítica (main.js 860 líneas) a arquitectura modular escalable.

## Cronograma

### Refactor #1: Core (State + Router + EventBus) - 3 horas
**Branch:** `refactor/01-core-modules`

- [ ] Implementar `State.js` con patrón Observer
- [ ] Implementar `Router.js` con sistema de rutas
- [ ] Implementar `EventBus.js` para comunicación
- [ ] Tests unitarios básicos
- [ ] Documentar API de cada módulo

**Archivos afectados:**
- `js/core/State.js` (nuevo)
- `js/core/Router.js` (nuevo)
- `js/core/EventBus.js` (nuevo)

**Tests:**
```bash
npm test -- core
```

---

### Refactor #2: Services - 2 horas
**Branch:** `refactor/02-services`

- [ ] Renombrar `api.js` → `TMDBService.js`
- [ ] Renombrar `storage.js` → `StorageService.js`
- [ ] Crear `FiltersService.js` (extraer de main.js)
- [ ] Crear `CacheService.js` (opcional)
- [ ] Actualizar imports

**Archivos afectados:**
- `js/api.js` → `js/services/TMDBService.js`
- `js/storage.js` → `js/services/StorageService.js`
- `js/services/FiltersService.js` (nuevo)

---

### Refactor #3: MoviesController - 4 horas
**Branch:** `refactor/03-movies-controller`

- [ ] Crear `MoviesController.js`
- [ ] Migrar `loadPopularMovies()` → `loadPopular()`
- [ ] Migrar `loadTopRatedMovies()` → `loadTopRated()`
- [ ] Migrar `loadUpcomingMovies()` → `loadUpcoming()`
- [ ] Consolidar en método genérico `#loadMovies()`
- [ ] Implementar `loadByGenre()`
- [ ] Implementar `loadMore()`
- [ ] Integrar con State.js

**Archivos afectados:**
- `js/controllers/MoviesController.js` (nuevo)
- `js/main.js` (reducir ~200 líneas)

---

### Refactor #4: Search, Filters, Favorites Controllers - 3 horas
**Branch:** `refactor/04-controllers`

- [ ] Crear `SearchController.js` (migrar desde search.js)
- [ ] Crear `FiltersController.js`
- [ ] Crear `FavoritesController.js`
- [ ] Crear `RecommendationsController.js` (migrar desde recommendations.js)
- [ ] Actualizar Router para usar controllers

**Archivos afectados:**
- `js/controllers/SearchController.js` (nuevo)
- `js/controllers/FiltersController.js` (nuevo)
- `js/controllers/FavoritesController.js` (nuevo)
- `js/controllers/RecommendationsController.js` (nuevo)
- `js/search.js` (eliminar después de migrar)
- `js/recommendations.js` (eliminar después de migrar)

---

### Refactor #5: UI Components - 4 horas
**Branch:** `refactor/05-ui-components`

- [ ] Crear `MovieCard.js` (extraer de ui.js)
- [ ] Migrar `modal.js` → `components/Modal.js`
- [ ] Crear `Sidebar.js`
- [ ] Crear `SearchBar.js`
- [ ] Crear `Filters.js`
- [ ] Crear `MoviesView.js` (migrar desde ui.js)
- [ ] Crear `ModalView.js`
- [ ] Crear `EmptyStateView.js`

**Archivos afectados:**
- `js/ui/components/*.js` (nuevos)
- `js/ui/views/*.js` (nuevos)
- `js/ui.js` (eliminar)
- `js/modal.js` (eliminar)

---

### Refactor #6: app.js Final + Cleanup - 2 horas
**Branch:** `refactor/06-final-cleanup`

- [ ] Implementar `app.js` completo
- [ ] Eliminar `main.js`
- [ ] Consolidar utils
- [ ] Actualizar `index.html` (cambiar script a app.js)
- [ ] Tests de integración
- [ ] Documentación final
- [ ] Performance audit

**Archivos afectados:**
- `js/app.js` (completar)
- `js/main.js` (eliminar)
- `index.html` (actualizar script)
- `js/utils/*.js` (consolidar)

---

## Checklist de Cada Refactor

Antes de mergear cada refactor:

- [ ] Código funciona sin errores
- [ ] Tests pasan (si aplica)
- [ ] Documentación actualizada
- [ ] Sin console.logs de debug
- [ ] Commit descriptivo
- [ ] PR creado y revisado

## Métricas de Éxito

| Métrica | Antes | Meta | Actual |
|---------|-------|------|--------|
| Líneas en app.js | 860 | 50 | - |
| Archivos JS | 10 | 25 | - |
| Código duplicado | Alto | Ninguno | - |
| Tests unitarios | 0 | 20+ | - |
| Cobertura | 0% | 60%+ | - |

## Riesgos

1. **Romper funcionalidad existente**
   - Mitigación: Tests manuales después de cada refactor
   
2. **Merge conflicts**
   - Mitigación: Refactors pequeños, merges frecuentes
   
3. **Performance regression**
   - Mitigación: Lighthouse audit antes/después


Última actualización: [23/11/2025]