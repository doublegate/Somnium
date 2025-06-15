/**
 * Simple logger utility for the Somnium engine
 * Provides consistent logging with ability to disable in production
 */

class Logger {
  constructor() {
    // Check if we're in development mode
    this.isDevelopment =
      typeof window !== 'undefined' &&
      window.location &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('192.168.'));

    // Log levels
    this.levels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      NONE: 4,
    };

    // Set default log level based on environment
    this.logLevel = this.isDevelopment ? this.levels.DEBUG : this.levels.WARN;
  }

  setLogLevel(level) {
    if (
      typeof level === 'string' &&
      this.levels[level.toUpperCase()] !== undefined
    ) {
      this.logLevel = this.levels[level.toUpperCase()];
    } else if (typeof level === 'number') {
      this.logLevel = level;
    }
  }

  debug(...args) {
    if (this.logLevel <= this.levels.DEBUG) {
      console.log('[DEBUG]', ...args);
    }
  }

  info(...args) {
    if (this.logLevel <= this.levels.INFO) {
      console.log('[INFO]', ...args);
    }
  }

  log(...args) {
    // Alias for info
    this.info(...args);
  }

  warn(...args) {
    if (this.logLevel <= this.levels.WARN) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args) {
    if (this.logLevel <= this.levels.ERROR) {
      console.error('[ERROR]', ...args);
    }
  }

  // Game-specific logging methods
  game(message, ...args) {
    this.info(`[Game] ${message}`, ...args);
  }

  ai(message, ...args) {
    this.debug(`[AI] ${message}`, ...args);
  }

  sound(message, ...args) {
    this.debug(`[Sound] ${message}`, ...args);
  }

  event(message, ...args) {
    this.debug(`[Event] ${message}`, ...args);
  }
}

// Create singleton instance
const logger = new Logger();

// Export both the logger instance and the Logger class
export { logger as default, Logger };
