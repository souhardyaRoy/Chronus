import { App } from "./src/app";
import { __middleware } from "./src/middleware";
import { allRoutes } from "./src/routes";
const dotenv = require('dotenv');
dotenv.config()
const PORT: number = 7000; // getting the port based on current environment.

const app = new App(PORT, __middleware,allRoutes);
 

const uri = 'mongodb://127.0.0.1:27017/Chronos'
app.mongoDB(uri);
 
app.listen();