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
2. **Merge conflicts**
   - Mitigación: Refactors pequeños, merges frecuentes
   
3. **Performance regression**
   - Mitigación: Lighthouse audit antes/después


Última actualización: [24/11/2025]