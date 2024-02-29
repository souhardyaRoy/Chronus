"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = __importDefault(require("express"));
const healthCheck_1 = require("../controller/healthCheck");
const healthRouter = express_1.default.Router();
exports.healthRouter = healthRouter;
healthRouter
    .get('/', healthCheck_1._HealthCheck.healthCheck);
