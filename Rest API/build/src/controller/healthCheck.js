"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._HealthCheck = void 0;
const logger_1 = __importDefault(require("../logger/logger"));
const { createRequestLog, createResponseLog } = logger_1.default;
class HealthCheck {
    static healthCheck(req, res) {
        logger_1.default.debug("debug");
        logger_1.default.warn("warn");
        logger_1.default.error("error");
        logger_1.default.info("info");
        logger_1.default.warn(createRequestLog(req));
        logger_1.default.warn(createResponseLog(200, req));
        res.status(200).json({ message: "running good" });
    }
}
exports._HealthCheck = HealthCheck;
