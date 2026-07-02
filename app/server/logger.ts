enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: any;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  private addLog(level: LogLevel, message: string, meta?: any, stack?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
      stack,
    };

    this.logs.push(entry);
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  info(message: string, meta?: any): void {
    const formatted = this.formatMessage(LogLevel.INFO, message, meta);
    console.log(formatted);
    this.addLog(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: any): void {
    const formatted = this.formatMessage(LogLevel.WARN, message, meta);
    console.warn(formatted);
    this.addLog(LogLevel.WARN, message, meta);
  }

  error(message: string, meta?: any, stack?: string): void {
    const formatted = this.formatMessage(LogLevel.ERROR, message, meta);
    console.error(formatted);
    this.addLog(LogLevel.ERROR, message, meta, stack);
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      const formatted = this.formatMessage(LogLevel.DEBUG, message, meta);
      console.debug(formatted);
      this.addLog(LogLevel.DEBUG, message, meta);
    }
  }

  /**
   * Get recent logs
   */
  getLogs(level?: LogLevel, limit = 100): LogEntry[] {
    let filtered = this.logs;
    
    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }
    
    return filtered.slice(-limit);
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();
