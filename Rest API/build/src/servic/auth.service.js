"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const jwt = __importStar(require("jsonwebtoken"));
class UserValidator {
    constructor() {
        this.isUserAuthorized = this.isUserAuthorized.bind(this);
    }
    isUserAuthorized(req, res, next) {
        try {
            const { authorization } = req.headers;
            let authToken;
            if (!authorization) {
                return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                    success: false,
                    message: "Authorization header is missing.",
                });
            }
            if (authorization.split(' ').length === 2 && (authorization.split(' ')[0] == 'Bearer' || authorization.split(' ')[0] == 'bearer')) {
                authToken = authorization.split(' ')[1];
            }
            else if (authorization.split(' ').length === 1) {
                authToken = authorization;
            }
            else {
                return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                    success: false,
                    message: "please provide the bearer token",
                });
            }
            jwt.verify(authToken, process.env.PASSWORD_HASH, function (err, decoded_token) {
                if (err) {
                    return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                        success: false,
                        message: "You are not authorized, please login.",
                    });
                }
                if (decoded_token.role === 'admin') {
                    // authorization successful.
                    req.body.user = decoded_token._id;
                    next();
                }
                else {
                    return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                        success: false,
                        message: "You are not authorized, please login.",
                    });
                }
            });
        }
        catch (error) {
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "something went wrong.",
            });
        }
    }
}
exports.default = new UserValidator();
