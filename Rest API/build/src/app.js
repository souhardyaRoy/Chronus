"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express = require("express");
const mongoose = require("mongoose");
const middleware_1 = require("./middleware");
class App {
    constructor(port, middleware, routes) {
        this.app = express();
        this.port = port;
        this.middleware(middleware);
        this.routes(routes);
        this.app.use(middleware_1.handle404); // Handle 404 errors
        this.app.use(middleware_1.handleError);
    }
    routes(routes) {
        for (const _routeKey in routes) {
            // console.log(_routeKey);
            this.app.use(`/${_routeKey}`, routes[_routeKey]);
        }
    }
    middleware(_middleware) {
        _middleware.forEach((m) => {
            this.app.use(m);
        });
    }
    listen() {
        this.app.listen(this.port, () => {
            console.log(`Server started at http://localhost:${this.port}`);
        });
    }
    mongoDB(uri) {
        const connect = () => {
            mongoose.set('strictQuery', false);
            const options = {
                autoCreate: true
            };
            mongoose.connect(uri).then(() => {
                console.log('DB connected successfully');
            }).catch((error) => {
                console.log("DB connection failed. \n", error);
                return process.exit(1);
            });
        };
        connect();
        mongoose.connection.on("disconnected", connect);
    }
}
exports.App = App;
