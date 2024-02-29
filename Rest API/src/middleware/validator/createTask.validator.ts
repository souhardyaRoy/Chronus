import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

class TaskValidator {

    constructor() {
        this.taskValidationMiddleware = this.taskValidationMiddleware.bind(this);
    }

    private taskSchema = Joi.object({
        jobId: Joi.string().required(),
        email: Joi.string().email().required(),
        command: Joi.string().required(),
        args: Joi.array().items(Joi.string().required()).required(),
        isImmediate: Joi.boolean().required(),
        isRecurring: Joi.boolean().required(),
        recursionDetails: Joi.object({
            totalAmountOfRecursion: Joi.number().optional().allow(null).default(null),
            intervalInSeconds: Joi.number().optional().allow(null).default(null)
        }).optional().default(null),
        isFutureSchedule: Joi.boolean().default(false),
        futureTimeAndDate: Joi.string().allow(null).default(null)
    });

    private getReadableErrorMessage(formattedError: string) {
        const errorFields = formattedError.split(".");
        const fieldNames = errorFields.map((field) => {
            const fieldName = field
                .split(/[\[\]"']/)
                .filter((item) => item !== "")
                .join(".");
            return fieldName.charAt(0) + fieldName.slice(1);
        });
        const readableErrorMessage = fieldNames.join(".") + " ";
        return readableErrorMessage;
    }

    private validateTask(task: any) {
        return this.taskSchema.validate(task);
    }

    private taskValidateMiddleware(req: Request, res: Response, next: NextFunction) {
        const { error } = this.validateTask(req.body);
        if (error) {
            const formattedError = error.details[0].message.replace(/"/g, "");
            console.error('Validation error:', error.message);
            return res.status(400).json({ error: this.getReadableErrorMessage(formattedError) });
        }
        next();
    };

    private customValidatorForTask(req: Request, res: Response, next: NextFunction) {
        if (req.body) {
            if (req.body.isImmediate && req.body.isFutureSchedule) {
                return res.status(400).json({ message:`a job can't be scheduled for immidiate purpose and also for future schedule` });
            }
            if (!req.body.isImmediate && !req.body.isFutureSchedule) {
                return res.status(400).json({ message:`a job can't be not scheduled for immidiate purpose and also not for future schedule` });
            }
            if(req.body.isRecurring && (!req.body?.recursionDetails || !req.body?.recursionDetails?.totalAmountOfRecursion || !req.body?.recursionDetails?.intervalInSeconds)){
                return res.status(400).json({ message:`If you are giving recursion as true then you have to specify all values for recursion` });
            }
            if ((req.body.isFutureSchedule && !req.body.futureTimeAndDate) || (!req.body.isFutureSchedule && req.body.futureTimeAndDate) ) {
                return res.status(400).json({ message:`If you want this job to be scheduled in future please make sure you are giving both isFutureSchedule and futureTimeAndDate` });
            }
            if(!req.body.isRecurring && (req.body?.recursionDetails || req.body?.recursionDetails?.totalAmountOfRecursion || req.body?.recursionDetails?.intervalInSeconds)){
                return res.status(400).json({ message:`If you are giving recursion as false then you can't give any recursion details` });
            } 
        }
        next();
    }

    // Combined middleware function
    public taskValidationMiddleware(req: Request, res: Response, next: NextFunction) {
        this.taskValidateMiddleware(req, res, (error) => {
            if (error) {
                return res.status(400).json({ error });
            } 
            this.customValidatorForTask(req, res, next);
        });
    }
}

export default new TaskValidator();
