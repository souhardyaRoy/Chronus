"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.AllowedRole = void 0;
const mongoose_1 = require("mongoose");
const index_1 = require("../util/index");
exports.AllowedRole = ['admin'];
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        minlength: 2,
        required: [true, 'Name is mandatory'],
        trim: true,
    },
    password: {
        type: String,
        minlength: 2,
        required: [true, 'Password is mandatory'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is mandatory'],
        unique: true,
        validate: [index_1.isEmail, 'Please enter a valid email']
    },
    role: {
        type: String,
        enum: exports.AllowedRole,
        default: 'admin',
    }
}, {
    timestamps: true,
    versionKey: false,
});
exports.User = (0, mongoose_1.model)('User', userSchema);
