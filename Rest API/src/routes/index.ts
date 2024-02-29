import { Router } from "express";
import { healthRouter } from "../routes/healthCheckRoute";
import { userRouter } from "../routes/userRoute";
import { taskRouter } from "./taskRoute";


export const allRoutes: Record<string, Router> = {
    'health' : healthRouter,
    'user' : userRouter,
    'task' : taskRouter
}
