/**
 * dom.js
 * Utilidades para manipulación del DOM
 * Migrado desde utils.js
 */

// TODO: Migrar desde utils.js en Refactor #6
export const loader = document.getElementById('loader');
export const resultsGrid = document.getElementById('results-grid');
export const modal = document.querySelector('.modal-overlay');
export const sectionTitle = document.getElementById('section-title');

export function showLoader() { 
    if (loader) loader.style.display = 'block'; 
}

export function hideLoader() { 
    if (loader) loader.style.display = 'none'; 
}

export function clearResults() { 
    if (resultsGrid) resultsGrid.innerHTML = ''; 
}

console.log('DOM utils loaded');