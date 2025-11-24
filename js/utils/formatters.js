/**
 * formatters.js
 * Funciones de formateo (fechas, números, etc.)
 */

// TODO: Implementar en Refactor #6
export function formatDate(dateString) {
    if (!dateString) return 'Sin fecha';
    try {
        return new Date(dateString).getFullYear();
    } catch (error) {
        return 'Sin fecha';
    }
}

export function formatCurrency(amount) {
    if (!amount || amount === 0) return 'N/A';
    return '$' + (amount / 1000000).toFixed(1) + 'M';
}

console.log('Formatters utils loaded');