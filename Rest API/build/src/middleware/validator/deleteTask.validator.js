"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
class DeleteTaskValidator {
    constructor() {
        this.AllowedRole = ['admin'];
        this.getTaskSchema = joi_1.default.object({
            jobId: joi_1.default.string().required(),
        });
        this.deleteTaskMiddleware = this.deleteTaskMiddleware.bind(this);
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
    validateTask(user) {
        return this.getTaskSchema.validate(user);
    }
    deleteTaskMiddleware(req, res, next) {
        const { error } = this.validateTask(req.params);
        if (error) {
            const formattedError = error.details[0].message.replace(/"/g, "");
            console.error('Validation error:', error.message);
            return res.status(400).json({ error: this.getReadableErrorMessage(formattedError) });
        }
        next();
    }
    ;
}
exports.default = new DeleteTaskValidator();
