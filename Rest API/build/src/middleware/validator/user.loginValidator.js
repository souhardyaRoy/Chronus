"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
class UserValidator {
    constructor() {
        this.userSchema = joi_1.default.object({
            password: joi_1.default.string().required(),
            email: joi_1.default.string().email().required(),
        });
        this.userLoginMiddleware = this.userLoginMiddleware.bind(this);
    }
    getReadableErrorMessage(formattedError) {
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
    validateUser(user) {
        return this.userSchema.validate(user);
    }
    userLoginMiddleware(req, res, next) {
        const { error } = this.validateUser(req.body);
        if (error) {
            const formattedError = error.details[0].message.replace(/"/g, "");
            console.error('Validation error:', error.message);
            return res.status(400).json({ error: this.getReadableErrorMessage(formattedError) });
        }
        next();
    }
    ;
}
exports.default = new UserValidator();
