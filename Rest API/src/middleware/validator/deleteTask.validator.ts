import Joi from 'joi';
import { GetTaskValidator } from './getTask.Validator';
import { Request,Response,NextFunction } from 'express';

 class DeleteTaskValidator  {
    private AllowedRole = ['admin'] as const;

    constructor() {
        this.deleteTaskMiddleware = this.deleteTaskMiddleware.bind(this);
    }

    private getTaskSchema = Joi.object({
        jobId: Joi.string().required(),
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

    private validateTask(user: any) {
        return this.getTaskSchema.validate(user);
    }

    public deleteTaskMiddleware(req: Request, res: Response, next: NextFunction) {
        const { error } = this.validateTask(req.params);
        if (error) {
            const formattedError = error.details[0].message.replace(/"/g, "");
            console.error('Validation error:', error.message);
            return res.status(400).json({ error: this.getReadableErrorMessage(formattedError) });
        }
        next();
    };

}

export default new DeleteTaskValidator();
