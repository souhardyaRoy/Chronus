import express, { Router } from 'express';
import  taskController from '../controller/taskController';
import createTaskValidator from '../middleware/validator/createTask.validator';
import authService from '../servic/auth.service';
import getTaskValidator from '../middleware/validator/getTask.Validator';
import updateTaskValidator from '../middleware/validator/updateTask.validator';
import deleteTaskValidator from '../middleware/validator/deleteTask.validator';
const taskRouter: Router = express.Router();

taskRouter.post('/',createTaskValidator.taskValidationMiddleware,authService.isUserAuthorized,taskController.createTask);

taskRouter.get('/:email',getTaskValidator.getTaskMiddleware,authService.isUserAuthorized,taskController.getTasksForUser)

taskRouter.put('/:jobId',updateTaskValidator.updateTaskValidationMiddleware,authService.isUserAuthorized,taskController.updateTask)

taskRouter.delete('/:jobId',deleteTaskValidator.deleteTaskMiddleware,authService.isUserAuthorized,taskController.deleteTask)

export { taskRouter };