// Sistema de logging profesional con niveles y colores

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    SUCCESS: 2,
    WARN: 3,
    ERROR: 4
};

const LOG_COLORS = {
    DEBUG: '#9e9e9e',
    INFO: '#2196f3',
    SUCCESS: '#4caf50',
    WARN: '#ff9800',
    ERROR: '#f44336'
};

const LOG_EMOJIS = {
    DEBUG: '🔍',
    INFO: 'ℹ️',
    SUCCESS: '✅',
    WARN: '⚠️',
    ERROR: '❌'
};

// Detectar si está en modo producción
const IS_PRODUCTION = window.location.hostname !== 'localhost' && 
                      window.location.hostname !== '127.0.0.1' &&
                      !window.location.hostname.includes('192.168');

class Logger {
    constructor(moduleName, enabled = true) {
        this.moduleName = moduleName;
        this.enabled = enabled && !IS_PRODUCTION; // Deshabilitar en producción
        
        // En producción, solo mostrar WARN y ERROR
        // En desarrollo, mostrar desde DEBUG
        this.currentLevel = IS_PRODUCTION ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
    }

    _log(level, message, data = null) {
        if (!this.enabled || LOG_LEVELS[level] < this.currentLevel) return;

        const timestamp = new Date().toLocaleTimeString('es-ES', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            fractionalSecondDigits: 3
        });

        const emoji = LOG_EMOJIS[level];
        const color = LOG_COLORS[level];
        const prefix = `${emoji} [${timestamp}] [${this.moduleName}] [${level}]`;

        const styles = [
            `color: ${color}`,
            'font-weight: bold'
        ].join(';');

        if (data !== null) {
            console.log(`%c${prefix}`, styles, message, data);
        } else {
            console.log(`%c${prefix}`, styles, message);
        }
    }

    debug(message, data = null) {
        this._log('DEBUG', message, data);
    }

    info(message, data = null) {
        this._log('INFO', message, data);
    }

    success(message, data = null) {
        this._log('SUCCESS', message, data);
    }

    warn(message, data = null) {
        this._log('WARN', message, data);
    }

    error(message, data = null) {
        this._log('ERROR', message, data);
    }

    group(title) {
        if (!this.enabled) return;
        console.group(`📦 ${title}`);
    }

    groupEnd() {
        if (!this.enabled) return;
        console.groupEnd();
    }

    table(data) {
        if (!this.enabled) return;
        console.table(data);
    }

    time(label) {
        if (!this.enabled) return;
        console.time(`⏱️ ${label}`);
    }

    timeEnd(label) {
        if (!this.enabled) return;
        console.timeEnd(`⏱️ ${label}`);
    }
}

// Log inicial sobre el modo
if (IS_PRODUCTION) {
    console.log(
        '%c🚀 MovieFinder - Modo Producción', 
        'color: #4caf50; font-weight: bold; font-size: 14px;'
    );
    console.log(
        '%cLos logs están limitados a advertencias y errores', 
        'color: #9e9e9e; font-size: 12px;'
    );
} else {
    console.log(
        '%c🛠️ MovieFinder - Modo Desarrollo', 
        'color: #2196f3; font-weight: bold; font-size: 14px;'
    );
    console.log(
        '%cLogs completos habilitados', 
        'color: #9e9e9e; font-size: 12px;'
    );
}

// Instancias de logger por módulo
export const apiLogger = new Logger('API');
export const uiLogger = new Logger('UI');
export const storageLogger = new Logger('STORAGE');
export const modalLogger = new Logger('MODAL');
export const recommendationsLogger = new Logger('RECOMMENDATIONS');
export const mainLogger = new Logger('MAIN');

// Logger global
export default Logger;