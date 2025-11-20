export const loader = document.getElementById('loader');
export const resultsGrid = document.getElementById('results-grid');
export const modal = document.querySelector('.modal-overlay');
export const sectionTitle = document.getElementById('section-title');

export function showLoader() { loader.style.display = 'block'; }
export function hideLoader() { loader.style.display = 'none'; }
export function clearResults() { resultsGrid.innerHTML = ''; }

export function formatDate(dateString) {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).getFullYear();
}

export function showEmptyMessage(message) {
    clearResults();
    resultsGrid.innerHTML = `<div class="empty-message">${message}</div>`;
}