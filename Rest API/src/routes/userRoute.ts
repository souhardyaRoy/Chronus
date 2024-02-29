import express, { Router } from 'express';
import userValidator from '../middleware/validator/user.validator';
import userController from '../controller/userController';
import userLoginValidator from '../middleware/validator/user.loginValidator';
const userRouter: Router = express.Router();

userRouter
    .post('/',userValidator.userCreationmiddleware,userController.createUser)

    userRouter
    .post('/login',userLoginValidator.userLoginMiddleware,userController.loginUser)

export { userRouter };