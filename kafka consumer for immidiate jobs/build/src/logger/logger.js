"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class Logger {
    constructor(logLevel) {
        this.logDirectory = path_1.default.join(__dirname, '..', '..', '..', 'logs');
        // Check if the log directory exists, if not, create it
        if (!fs_1.default.existsSync(this.logDirectory)) {
            fs_1.default.mkdirSync(this.logDirectory, { recursive: true });
        }
        const transport = new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(this.logDirectory, `combined.log`),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
            frequency: '24h',
            json: false,
        });
        this.logger = winston_1.default.createLogger({
            level: logLevel,
            format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.printf(this.logFormat.bind(this))),
            transports: [
                new winston_1.default.transports.Console(),
                transport,
            ],
        });
    }
    logFormat(info) {
        const { level, message, timestamp } = info;
        const { type, method, url, params, query, pathParams, statusCode } = message;
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
        }
        else if (type === 'response') {
            formattedMessage += ` Response: ${statusCode} "${url}"`;
            if (statusCode && statusCode >= 200 && statusCode < 300) {
                formattedMessage += ` (for successful ${statusCode} message no need to send body..)`;
            }
            else if (statusCode && statusCode >= 400 && statusCode < 500) {
                formattedMessage += ' (Client error: Bad Request)';
            }
            else if (statusCode && statusCode >= 500 && statusCode < 600) {
                formattedMessage += ' (Server error: Internal Server Error)';
            }
        }
        else {
            formattedMessage += ` ${JSON.stringify(message)}`;
        }
        return formattedMessage;
    }
    info(message) {
        this.logger.info(message);
    }
    error(message) {
        this.logger.error(message);
    }
    warn(message) {
        this.logger.warn(message);
    }
    debug(message) {
        this.logger.debug(message);
    }
    createRequestLog(req) {
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
    createResponseLog(statusCode, req, message = '') {
        const { method, originalUrl } = req;
        const formattedUrl = originalUrl.replace(/\\/g, ''); // Remove backslashes from the URL
        let responseLogs = `Response: ${statusCode} ${formattedUrl}`;
        if (statusCode >= 200 && statusCode < 300) {
            responseLogs += '';
        }
        else if (statusCode >= 400 && statusCode < 500 && message) {
            responseLogs += ` Client error: ${message}`;
        }
        else {
            responseLogs += ` Server error: ${message || 'Internal Server Error'}`;
        }
        return responseLogs;
    }
}
exports.default = new Logger(process.env.LOG_LEVEL || 'debug');
