"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allRoutes = void 0;
const healthCheckRoute_1 = require("../routes/healthCheckRoute");
const userRoute_1 = require("../routes/userRoute");
const taskRoute_1 = require("./taskRoute");
exports.allRoutes = {
    'health': healthCheckRoute_1.healthRouter,
    'user': userRoute_1.userRouter,
    'task': taskRoute_1.taskRouter
};
