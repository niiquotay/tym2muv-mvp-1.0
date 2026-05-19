type LogLevel = 'info' | 'warn' | 'error';
type LogContext = Record<string, unknown>;

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const env = import.meta.env.MODE;
    const version = import.meta.env.VITE_APP_VERSION || 'unknown';
    return JSON.stringify({
      timestamp,
      level,
      env,
      version,
      message,
      ...context
    });
  }

  info(message: string, context?: LogContext) {
    if (import.meta.env.PROD) return;
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(error: unknown, context?: LogContext) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    
    const formattedLog = this.formatMessage('error', errorMsg, {
      stack,
      ...context
    });
    
    console.error(formattedLog);

    // Integrate with external reporting tools here (e.g., Sentry)
    if (import.meta.env.PROD && typeof window !== 'undefined') {
        const errorEndpoint = '/api/log'; // or Sentry DSN
        // we could do a fire-and-forget fetch here if we had a dedicated endpoint
        // fetch(errorEndpoint, { method: 'POST', body: formattedLog, keepalive: true }).catch(() => {});
    }
  }

  trackPageView(page: string) {
    this.info(`Page view: ${page}`);
  }
}

export const logger = new Logger();
