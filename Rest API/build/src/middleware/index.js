"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = exports.handle404 = exports.__middleware = void 0;
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const http_status_codes_1 = require("http-status-codes");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
exports.__middleware = [
    body_parser_1.default.json(),
    body_parser_1.default.urlencoded({ extended: true }),
    // cors(corsOptions),
    (0, cors_1.default)(),
    apiLimiter,
    (req, res, next) => {
        res.set('Cache-Control', 'no-store, max-age=0');
        next();
    },
    (req, res, next) => {
        res.header("Access-Control-Allow-Origin", '*');
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    },
    (error, req, res, next) => {
        if (error.type == 'time-out')
            return res.status(http_status_codes_1.StatusCodes.REQUEST_TIMEOUT).json(error);
        else
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: error.message,
            });
    }
];
// Middleware to handle 404 errors
const handle404 = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        message: error.message,
    });
};
exports.handle404 = handle404;
// Middleware to handle other errors
const handleError = (error, req, res, next) => {
    if (error.type == 'time-out') {
        return res.status(http_status_codes_1.StatusCodes.REQUEST_TIMEOUT).json(error);
    }
    else {
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: error.message,
        });
    }
};
exports.handleError = handleError;
