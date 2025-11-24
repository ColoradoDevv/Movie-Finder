/**
 * validators.js
 * Funciones de validación
 */

// TODO: Implementar en Refactor #6
export function isValidMovieId(id) {
    return id && !isNaN(id) && parseInt(id) > 0;
}

export function isValidSearchQuery(query) {
    return query && query.trim().length >= 2;
}

console.log('Validators utils loaded');