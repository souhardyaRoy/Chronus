"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./src/app");
const middleware_1 = require("./src/middleware");
const routes_1 = require("./src/routes");
const dotenv = require('dotenv');
dotenv.config();
const PORT = 7000; // getting the port based on current environment.
const app = new app_1.App(PORT, middleware_1.__middleware, routes_1.allRoutes);
const uri = 'mongodb://127.0.0.1:27017/Chronos';
app.mongoDB(uri);
app.listen();
