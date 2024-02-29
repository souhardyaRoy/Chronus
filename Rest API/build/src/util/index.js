"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmail = exports.handleDuplicateKeyError = void 0;
const handleDuplicateKeyError = (error, res) => {
    if (error.code === 11000) {
        // Extract the field names from the error message
        const fieldNames = Object.keys(error.keyPattern);
        return { success: false, message: `${fieldNames.join(', ')} already exist` };
    }
};
exports.handleDuplicateKeyError = handleDuplicateKeyError;
const isEmail = (email) => {
    const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return regex.test(email);
};
exports.isEmail = isEmail;
