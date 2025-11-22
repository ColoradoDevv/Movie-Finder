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

export function formatDate(dateString) {
    if (!dateString) return 'Sin fecha';
    try {
        return new Date(dateString).getFullYear();
    } catch (error) {
        return 'Sin fecha';
    }
}

export function showEmptyMessage(message) {
    clearResults();
    if (resultsGrid) {
        resultsGrid.innerHTML = `<div class="empty-message">${message}</div>`;
    }
}

/**
 * Genera un placeholder SVG local para imágenes faltantes
 * @param {number} width - Ancho del placeholder
 * @param {number} height - Alto del placeholder
 * @param {string} text - Texto a mostrar
 * @returns {string} - Data URL del SVG
 */
export function getPlaceholderImage(width = 500, height = 750, text = 'Sin Poster') {
    // Escapar el texto para evitar problemas con caracteres especiales en SVG
    const escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1f1f1f"/>
        <text 
            x="50%" 
            y="45%" 
            font-family="Arial, sans-serif" 
            font-size="24" 
            fill="#808080" 
            text-anchor="middle" 
            dominant-baseline="middle"
        >${escapedText}</text>
        <g transform="translate(${width/2}, ${height * 0.65})">
            <circle r="35" fill="#404040" opacity="0.3"/>
            <rect x="-20" y="-12" width="40" height="24" rx="2" fill="#606060"/>
            <rect x="-18" y="-10" width="36" height="20" fill="#2a2a2a"/>
            <circle cx="-25" cy="0" r="8" fill="#505050"/>
            <circle cx="-25" cy="0" r="5" fill="#707070"/>
            <path d="M 20 -8 L 28 -12 L 28 12 L 20 8 Z" fill="#606060"/>
        </g>
    </svg>`;
    
    // Usar encodeURIComponent en lugar de btoa para evitar problemas con caracteres especiales
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Maneja errores de carga de imágenes
 * @param {HTMLImageElement} img - Elemento de imagen
 */
export function handleImageError(img) {
    if (img && !img.dataset.errorHandled) {
        img.dataset.errorHandled = 'true';
        img.src = getPlaceholderImage();
        img.alt = 'Imagen no disponible';
    }
}