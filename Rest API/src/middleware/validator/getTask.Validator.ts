import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export class GetTaskValidator {
    private AllowedRole = ['admin'] as const;

    constructor() {
        this.getTaskMiddleware = this.getTaskMiddleware.bind(this);
    }

    private getTaskSchema = Joi.object({
        email: Joi.string().email().required(),
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

    public getTaskMiddleware(req: Request, res: Response, next: NextFunction) {
        const { error } = this.validateTask(req.params);
        if (error) {
            const formattedError = error.details[0].message.replace(/"/g, "");
            console.error('Validation error:', error.message);
            return res.status(400).json({ error: this.getReadableErrorMessage(formattedError) });
        }
        next();
    };

}

export default new GetTaskValidator();
