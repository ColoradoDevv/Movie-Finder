/**
 * app.js
 * Punto de entrada principal de la aplicación
 * Inicializa todos los módulos y conecta la arquitectura
 */

import { mainLogger } from './logger.js';

mainLogger.info('🚀 MovieFinder v2.0 - Arquitectura Modular');

// TODO: Implementar en Refactor #6 (después de tener todos los módulos)
async function initApp() {
    mainLogger.info('⚠️ Modo de transición: usando main.js legacy');
    
    // Por ahora, importar y ejecutar main.js antiguo
    const { default: legacyInit } = await import('./main.js');
    
    mainLogger.warn('Refactorización en progreso...');
}

// Ejecutar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}