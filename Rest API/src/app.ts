import { Application } from "express";
import express = require('express')
import mongoose = require("mongoose");
import { handle404, handleError } from './middleware';
export class App {

    public app: Application
    private port: number

    constructor(port: number, middleware: Array<any>, routes: Record<string, express.Router>) {
        this.app = express()
        this.port = port
        this.middleware(middleware)
        this.routes(routes)
        this.app.use(handle404); // Handle 404 errors
        this.app.use(handleError);
    }

    private routes(routes: Record<string, express.Router>) {
        for (const _routeKey in routes) {
            // console.log(_routeKey);
            this.app.use(`/${_routeKey}`, routes[_routeKey]);
        }
    }
    private middleware(_middleware: any[]) {
        _middleware.forEach((m) => {
            this.app.use(m);
        });
    }

    public listen() {
        this.app.listen(this.port, () => {
            console.log(`Server started at http://localhost:${this.port}`);
        });
    }

    public mongoDB(uri: string) {
        const connect = () => {
            mongoose.set('strictQuery', false);
            const options: mongoose.ConnectOptions = {
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