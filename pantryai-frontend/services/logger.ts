// Frontend logging utility
class Logger {
    private isDevelopment = __DEV__;
    private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'debug';

    private formatMessage(level: string, message: string, data?: any): string {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        
        if (data) {
            return `${prefix} ${message} | Data: ${JSON.stringify(data, null, 2)}`;
        }
        return `${prefix} ${message}`;
    }

    debug(message: string, data?: any): void {
        if (this.isDevelopment && this.shouldLog('debug')) {
            console.log(this.formatMessage('debug', message, data));
        }
    }

    info(message: string, data?: any): void {
        if (this.shouldLog('info')) {
            console.info(this.formatMessage('info', message, data));
        }
    }

    warn(message: string, data?: any): void {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, data));
        }
    }

    error(message: string, error?: any): void {
        if (this.shouldLog('error')) {
            console.error(this.formatMessage('error', message, error));
            
            // Log additional error details
            if (error) {
                if (error.response) {
                    console.error('API Error Response:', {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: error.response.data,
                        headers: error.response.headers,
                        url: error.response.config?.url,
                        method: error.response.config?.method,
                    });
                } else if (error.request) {
                    console.error('Network Error:', {
                        request: error.request,
                        message: error.message,
                    });
                } else {
                    console.error('Error Details:', {
                        message: error.message,
                        stack: error.stack,
                    });
                }
            }
        }
    }

    private shouldLog(level: string): boolean {
        const levels = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(level) >= levels.indexOf(this.logLevel);
    }

    setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
        this.logLevel = level;
    }

    // Special method for API logging
    apiCall(method: string, url: string, data?: any): void {
        this.info(`API Call: ${method.toUpperCase()} ${url}`, data);
    }

    apiResponse(method: string, url: string, status: number, data?: any): void {
        this.info(`API Response: ${method.toUpperCase()} ${url} - ${status}`, data);
    }

    apiError(method: string, url: string, error: any): void {
        this.error(`API Error: ${method.toUpperCase()} ${url}`, error);
    }
}

export const logger = new Logger(); 