import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

class UserValidator {
    private AllowedRole = ['admin'] as const;

    constructor() {
        this.userCreationmiddleware = this.userCreationmiddleware.bind(this);
    }

    private userSchema = Joi.object({
        name: Joi.string().min(2).required().trim(),
        password: Joi.string().required(),
        email: Joi.string().email().required(),
        role: Joi.string().valid(...this.AllowedRole).optional() // or allow null for default
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

    private validateUser(user: any) {
        return this.userSchema.validate(user);
    }

    public userCreationmiddleware(req: Request, res: Response, next: NextFunction) {
        const { error } = this.validateUser(req.body);
        if (error) {
            const formattedError = error.details[0].message.replace(/"/g, "");
            console.error('Validation error:', error.message);
            return res.status(400).json({ error: this.getReadableErrorMessage(formattedError) });
        }
        next();
    };

}

export default new UserValidator();
