import express, { Router } from 'express';
import { _HealthCheck } from '../controller/healthCheck';

const healthRouter: Router = express.Router();

healthRouter
    .get('/',_HealthCheck.healthCheck)

export { healthRouter };