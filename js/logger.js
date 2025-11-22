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

class Logger {
    constructor(moduleName, enabled = true) {
        this.moduleName = moduleName;
        this.enabled = enabled;
        this.currentLevel = LOG_LEVELS.DEBUG; // Cambiar a INFO para producción
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
        console.group(`📦 ${title}`);
    }

    groupEnd() {
        console.groupEnd();
    }

    table(data) {
        console.table(data);
    }

    time(label) {
        console.time(`⏱️ ${label}`);
    }

    timeEnd(label) {
        console.timeEnd(`⏱️ ${label}`);
    }
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