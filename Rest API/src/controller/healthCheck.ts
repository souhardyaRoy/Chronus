import { Request, Response } from "express";
import logger from "../logger/logger";
const {createRequestLog , createResponseLog }= logger
 class HealthCheck {

    static healthCheck(req:Request,res:Response){
        logger.debug("debug")
        logger.warn("warn")
        logger.error("error")
        logger.info("info")
        logger.warn(createRequestLog(req))
        logger.warn(createResponseLog(200,req))

        res.status(200).json({message:"running good"})
    }

}
export const _HealthCheck = HealthCheck
