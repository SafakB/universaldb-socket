const config = require('../config/server');

// Basit logger implementasyonu (winston olmadan)
class Logger {
    constructor() {
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
        this.currentLevel = config.nodeEnv === 'production' ? 'info' : 'debug';
    }

    log(level, message, meta = {}) {
        if (this.levels[level] <= this.levels[this.currentLevel]) {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                level,
                message,
                ...meta
            };
            
            if (level === 'error') {
                console.error(`[${timestamp}] ERROR: ${message}`, meta);
            } else if (level === 'warn') {
                console.warn(`[${timestamp}] WARN: ${message}`, meta);
            } else {
                console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta);
            }
        }
    }

    error(message, meta) {
        this.log('error', message, meta);
    }

    warn(message, meta) {
        this.log('warn', message, meta);
    }

    info(message, meta) {
        this.log('info', message, meta);
    }

    debug(message, meta) {
        this.log('debug', message, meta);
    }
}

module.exports = new Logger();