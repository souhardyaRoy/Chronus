"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = __importDefault(require("express"));
const user_validator_1 = __importDefault(require("../middleware/validator/user.validator"));
const userController_1 = __importDefault(require("../controller/userController"));
const user_loginValidator_1 = __importDefault(require("../middleware/validator/user.loginValidator"));
const userRouter = express_1.default.Router();
exports.userRouter = userRouter;
userRouter
    .post('/', user_validator_1.default.userCreationmiddleware, userController_1.default.createUser);
userRouter
    .post('/login', user_loginValidator_1.default.userLoginMiddleware, userController_1.default.loginUser);
