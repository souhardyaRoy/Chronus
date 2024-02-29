"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskRouter = void 0;
const express_1 = __importDefault(require("express"));
const taskController_1 = __importDefault(require("../controller/taskController"));
const createTask_validator_1 = __importDefault(require("../middleware/validator/createTask.validator"));
const auth_service_1 = __importDefault(require("../servic/auth.service"));
const getTask_Validator_1 = __importDefault(require("../middleware/validator/getTask.Validator"));
const updateTask_validator_1 = __importDefault(require("../middleware/validator/updateTask.validator"));
const deleteTask_validator_1 = __importDefault(require("../middleware/validator/deleteTask.validator"));
const taskRouter = express_1.default.Router();
exports.taskRouter = taskRouter;
taskRouter.post('/', createTask_validator_1.default.taskValidationMiddleware, auth_service_1.default.isUserAuthorized, taskController_1.default.createTask);
taskRouter.get('/:email', getTask_Validator_1.default.getTaskMiddleware, auth_service_1.default.isUserAuthorized, taskController_1.default.getTasksForUser);
taskRouter.put('/:jobId', updateTask_validator_1.default.updateTaskValidationMiddleware, auth_service_1.default.isUserAuthorized, taskController_1.default.updateTask);
taskRouter.delete('/:jobId', deleteTask_validator_1.default.deleteTaskMiddleware, auth_service_1.default.isUserAuthorized, taskController_1.default.deleteTask);
