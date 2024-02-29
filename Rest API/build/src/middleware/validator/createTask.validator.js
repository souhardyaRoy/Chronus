"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
class TaskValidator {
    constructor() {
        this.taskSchema = joi_1.default.object({
            jobId: joi_1.default.string().required(),
            email: joi_1.default.string().email().required(),
            command: joi_1.default.string().required(),
            args: joi_1.default.array().items(joi_1.default.string().required()).required(),
            isImmediate: joi_1.default.boolean().required(),
            isRecurring: joi_1.default.boolean().required(),
            recursionDetails: joi_1.default.object({
                totalAmountOfRecursion: joi_1.default.number().optional().allow(null).default(null),
                intervalInSeconds: joi_1.default.number().optional().allow(null).default(null)
            }).optional().default(null),
            isFutureSchedule: joi_1.default.boolean().default(false),
            futureTimeAndDate: joi_1.default.string().allow(null).default(null)
        });
        this.taskValidationMiddleware = this.taskValidationMiddleware.bind(this);
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
    validateTask(task) {
        return this.taskSchema.validate(task);
    }
    taskValidateMiddleware(req, res, next) {
        const { error } = this.validateTask(req.body);
        if (error) {
            const formattedError = error.details[0].message.replace(/"/g, "");
            console.error('Validation error:', error.message);
            return res.status(400).json({ error: this.getReadableErrorMessage(formattedError) });
        }
        next();
    }
    ;
    customValidatorForTask(req, res, next) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        if (req.body) {
            if (req.body.isImmediate && req.body.isFutureSchedule) {
                return res.status(400).json({ message: `a job can't be scheduled for immidiate purpose and also for future schedule` });
            }
            if (!req.body.isImmediate && !req.body.isFutureSchedule) {
                return res.status(400).json({ message: `a job can't be not scheduled for immidiate purpose and also not for future schedule` });
            }
            if (req.body.isRecurring && (!((_a = req.body) === null || _a === void 0 ? void 0 : _a.recursionDetails) || !((_c = (_b = req.body) === null || _b === void 0 ? void 0 : _b.recursionDetails) === null || _c === void 0 ? void 0 : _c.totalAmountOfRecursion) || !((_e = (_d = req.body) === null || _d === void 0 ? void 0 : _d.recursionDetails) === null || _e === void 0 ? void 0 : _e.intervalInSeconds))) {
                return res.status(400).json({ message: `If you are giving recursion as true then you have to specify all values for recursion` });
            }
            if ((req.body.isFutureSchedule && !req.body.futureTimeAndDate) || (!req.body.isFutureSchedule && req.body.futureTimeAndDate)) {
                return res.status(400).json({ message: `If you want this job to be scheduled in future please make sure you are giving both isFutureSchedule and futureTimeAndDate` });
            }
            if (!req.body.isRecurring && (((_f = req.body) === null || _f === void 0 ? void 0 : _f.recursionDetails) || ((_h = (_g = req.body) === null || _g === void 0 ? void 0 : _g.recursionDetails) === null || _h === void 0 ? void 0 : _h.totalAmountOfRecursion) || ((_k = (_j = req.body) === null || _j === void 0 ? void 0 : _j.recursionDetails) === null || _k === void 0 ? void 0 : _k.intervalInSeconds))) {
                return res.status(400).json({ message: `If you are giving recursion as false then you can't give any recursion details` });
            }
        }
        next();
    }
    // Combined middleware function
    taskValidationMiddleware(req, res, next) {
        this.taskValidateMiddleware(req, res, (error) => {
            if (error) {
                return res.status(400).json({ error });
            }
            this.customValidatorForTask(req, res, next);
        });
    }
}
exports.default = new TaskValidator();
