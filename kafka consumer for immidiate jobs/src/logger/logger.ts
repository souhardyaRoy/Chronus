import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

interface RequestMessage {
  type: string;
  method: string;
  url: string;
  params?: Record<string, any>;
  query?: Record<string, any>;
  pathParams?: Record<string, any>;
  statusCode?: number;
}

class Logger {
  private logger: winston.Logger;
  private logDirectory: string;

  constructor(logLevel: string) {
    this.logDirectory = path.join(__dirname, '..', '..', '..', 'logs');

    // Check if the log directory exists, if not, create it
    if (!fs.existsSync(this.logDirectory)) {
        fs.mkdirSync(this.logDirectory, { recursive: true });
      }
    const transport = new DailyRotateFile({
      filename: path.join(this.logDirectory, `combined.log`),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d', // Keep logs for 14 days
      frequency: '24h',
      json: false,
    });

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.printf(this.logFormat.bind(this)),
      ),
      transports: [
        new winston.transports.Console(),
        transport,
      ],
    });
  }

  private logFormat(info: winston.Logform.TransformableInfo): string {
    const { level, message, timestamp } = info;
    const { type, method, url, params, query, pathParams, statusCode } = message as RequestMessage;
    let formattedMessage = `${level.toUpperCase()}: ${timestamp} -`;

    if (type === 'request') {
      formattedMessage += ` Request: ${method} ${url}`;
      if (pathParams) {
        formattedMessage += ` pathParams: ${JSON.stringify(pathParams)}`;
      }
      if (params) {
        formattedMessage += ` params: ${JSON.stringify(params)}`;
      }
      if (query) {
        formattedMessage += ` query: ${JSON.stringify(query)}`;
      }
    } else if (type === 'response') {
      formattedMessage += ` Response: ${statusCode} "${url}"`;

      if (statusCode && statusCode >= 200 && statusCode < 300) {
        formattedMessage += ` (for successful ${statusCode} message no need to send body..)`;
      } else if (statusCode && statusCode >= 400 && statusCode < 500) {
        formattedMessage += ' (Client error: Bad Request)';
      } else if (statusCode && statusCode >= 500 && statusCode < 600) {
        formattedMessage += ' (Server error: Internal Server Error)';
      }
    } else {
      formattedMessage += ` ${JSON.stringify(message)}`;
    }
    return formattedMessage;
  }

  public info(message: string): void {
    this.logger.info(message);
  }

  public error(message: string): void {
    this.logger.error(message);
  }

  public warn(message: string): void {
    this.logger.warn(message);
  }
  
  public debug(message: string): void {
    this.logger.debug(message);
  }

  public createRequestLog(req: any): string {
    const { method, originalUrl, query, params } = req;
    let logMessage = `Request ${method} ${originalUrl}`;

    const pathParams = params ? Object.keys(params).map(key => `'${key}':'${params[key]}'`).join(' and ') : '';
    const queryParams = query ? Object.keys(query).map(key => `'${key}':'${query[key]}'`).join(' and ') : '';

    if (pathParams) {
      logMessage += ` pathParams: ${pathParams}`;
    }

    if (queryParams) {
      logMessage += ` query: ${queryParams}`;
    }

    return logMessage;
  }
  
  public createResponseLog(statusCode: number, req: any, message: string = ''): string {
    const { method, originalUrl } = req;
    const formattedUrl = originalUrl.replace(/\\/g, ''); // Remove backslashes from the URL
    let responseLogs = `Response: ${statusCode} ${formattedUrl}`;
    if (statusCode >= 200 && statusCode < 300) {
        responseLogs += '';
    } else if (statusCode >= 400 && statusCode < 500 && message) {
        responseLogs += ` Client error: ${message}`;
    } else {
        responseLogs += ` Server error: ${message || 'Internal Server Error'}`;
    }
    return responseLogs;
}

}

export default new Logger(process.env.LOG_LEVEL || 'debug');
