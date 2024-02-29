"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = __importStar(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
const http_status_codes_1 = require("http-status-codes");
const user_schema_1 = require("../schema/user.schema");
const index_1 = require("../util/index");
class UserController {
    constructor() {
        this.createUser = this.createUser.bind(this);
        this.loginUser = this.loginUser.bind(this);
    }
    createUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Extract user data from the request body
                const userData = req.body;
                // Hash the password synchronously
                const hash = yield bcrypt.hash(userData.password, 10);
                // Update the password with the hashed value
                userData.password = hash;
                // Create the user
                const newUser = yield user_schema_1.User.create(userData);
                return res.status(http_status_codes_1.StatusCodes.CREATED).json({
                    success: true,
                    message: 'User created successfully',
                    user: newUser,
                });
            }
            catch (error) {
                if (error.code === 11000) {
                    // Handle duplicate key error
                    return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json((0, index_1.handleDuplicateKeyError)(error, res));
                }
                // Handle other errors
                return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: 'Failed to create user',
                    error: error.message,
                });
            }
        });
    }
    loginUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // this is authentication.
            try {
                const { email, password } = req.body;
                const _user = yield user_schema_1.User.findOne({ email: email });
                if (_user) {
                    const match = yield bcrypt.compare(password, _user.password); //dusra wala chupaya wala jo db m h
                    if (match) {
                        // generate token.
                        const secret_key = process.env.PASSWORD_HASH;
                        const payload = { _id: _user._id, role: _user.role };
                        const token = jwt.sign(payload, secret_key, { expiresIn: 60 * 60 });
                        return res.status(http_status_codes_1.StatusCodes.OK).json({ token: token });
                    }
                    else {
                        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                            message: "Username/password invalid",
                            success: false
                        });
                    }
                }
                else {
                    // username was wrong, it does not exist in the database.
                    return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                        message: "Username/password invalid",
                        success: false
                    });
                }
            }
            catch (error) {
                return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: 'Failed to login user',
                    error: error.message,
                });
            }
        });
    }
}
exports.default = new UserController();
