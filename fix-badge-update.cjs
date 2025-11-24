// Script para agregar la actualización de badges en el event listener
// Ejecutar con: node fix-badge-update.js

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'js', 'main.js');
let content = fs.readFileSync(filePath, 'utf8');

// Buscar el event listener y agregar las líneas
const searchPattern = `    modal.addEventListener('movie-state-changed', () => {
        mainLogger.debug('🔔 Evento movie-state-changed recibido');
        updateGrid();
    });`;

const replacement = `    modal.addEventListener('movie-state-changed', () => {
        mainLogger.debug('🔔 Evento movie-state-changed recibido');
        updateGrid();
        // Actualizar badges de favoritos y vistas
        const favCount = StorageService.getFavorites().length;
        const watchedCount = StorageService.getWatched().length;
        updateNavigationBadges(favCount, watchedCount);
    });`;

if (content.includes(searchPattern)) {
    content = content.replace(searchPattern, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Badge update agregado exitosamente!');
} else {
    console.log('❌ No se encontró el patrón en el archivo');
}
