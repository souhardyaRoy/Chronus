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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const task_schema_1 = require("../schema/task.schema");
const index_1 = require("../util/index");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const kafka = __importStar(require("kafka-node"));
class TaskController {
    constructor() {
        this.kafkaClient = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
        this.producer = new kafka.Producer(this.kafkaClient);
        this.createTask = this.createTask.bind(this);
        this.getTasksForUser = this.getTasksForUser.bind(this); // Bind the method
        this.updateTask = this.updateTask.bind(this);
    }
    createTask(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const taskData = req.body;
                const pipeline = [
                    {
                        $match: {
                            jobId: taskData.jobId,
                        }
                    },
                ];
                const task = yield task_schema_1.Task.aggregate(pipeline).exec();
                if (task.length !== 0) {
                    return res.status(http_status_codes_1.StatusCodes.CONFLICT).json({
                        success: false,
                        message: 'Task already exists for the provided jobId',
                    });
                }
                if (!path_1.default.isAbsolute(taskData.args[0])) {
                    return res.status(400).json({ message: 'args must be an absolute path' });
                }
                if (!fs_1.default.existsSync(taskData.args[0])) {
                    return res.status(400).json({ message: 'File does not exist' });
                }
                const newTask = yield task_schema_1.Task.create(taskData);
                if (taskData.isImmediate) {
                    const payload = [{ topic: 'immidiateNoRecur', messages: JSON.stringify(taskData) }];
                    this.producer.send(payload, (error, data) => {
                        if (error) {
                            console.error('Error producing message to Kafka:', error);
                        }
                        else {
                            console.log('Message produced to Kafka: ', payload[0].topic, payload[0].messages);
                        }
                    });
                }
                if (taskData.isFutureSchedule) {
                    const payload = [{ topic: 'futureTimeScheduled', messages: JSON.stringify(taskData) }];
                    this.producer.send(payload, (error, data) => {
                        if (error) {
                            console.error('Error producing message to Kafka:', error);
                        }
                        else {
                            console.log('Message produced to Kafka:', payload[0].topic, payload[0].messages);
                        }
                    });
                }
                return res.status(http_status_codes_1.StatusCodes.CREATED).json({
                    success: true,
                    message: 'Task created successfully',
                    newTask
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
                    message: 'Failed to create task',
                    error: error.message,
                });
            }
        });
    }
    getTasksForUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userEmail = req.params.email; // Extract the user's email from the request params
                // Aggregation pipeline to fetch tasks for a specific user
                const tasks = yield task_schema_1.Task.aggregate([
                    {
                        $lookup: {
                            from: "users",
                            localField: "user",
                            foreignField: "_id",
                            as: "user"
                        }
                    },
                    {
                        $unwind: "$user"
                    },
                    {
                        $match: {
                            "user.email": userEmail
                        }
                    }
                ]);
                if (tasks.length === 0) {
                    return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                        success: false,
                        message: 'Tasks not found for the user with the provided email',
                    });
                }
                return res.status(http_status_codes_1.StatusCodes.OK).json({
                    success: true,
                    message: 'Tasks retrieved successfully for user',
                    tasks
                });
            }
            catch (error) {
                return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: 'Failed to fetch tasks for user',
                    error: error.message,
                });
            }
        });
    }
    updateTask(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const jobId = req.params.jobId; // Extract the jobId from the request params
                const updateData = req.body;
                if (!path_1.default.isAbsolute(updateData.args[0])) {
                    return res.status(400).json({ message: 'args must be an absolute path' });
                }
                if (!fs_1.default.existsSync(updateData.args[0])) {
                    return res.status(400).json({ message: 'File does not exist' });
                }
                const allowedFields = ['command', 'args', 'isImmediate', 'isRecurring', 'recursionDetails', 'isFutureSchedule', 'futureTimeAndDate'];
                // Construct update object based on fields present in request body
                const updateObject = {};
                allowedFields.forEach(field => {
                    if (updateData.hasOwnProperty(field)) {
                        updateObject[field] = updateData[field];
                    }
                });
                // Check if update object is empty
                if (Object.keys(updateObject).length === 0) {
                    return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                        success: false,
                        message: 'No valid fields provided for update',
                    });
                }
                // Aggregation pipeline to find and update the task based on jobId
                const pipeline = [
                    {
                        $match: {
                            jobId: jobId,
                        }
                    },
                    {
                        $set: updateObject
                    }
                ];
                const updatedTask = yield task_schema_1.Task.aggregate(pipeline).exec();
                if (updatedTask.length === 0) {
                    return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                        success: false,
                        message: 'Task not found for the provided jobId',
                    });
                }
                if (updateData.taskStatus) {
                    return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                        success: false,
                        message: 'Task is already completed you can not update a completed task',
                    });
                }
                if (updateData.isImmediate) {
                    const payload = [{ topic: 'immidiateNoRecur', messages: JSON.stringify(updateData) }];
                    this.producer.send(payload, (error, data) => {
                        if (error) {
                            console.error('Error producing message to Kafka:', error);
                        }
                        else {
                            console.log('Message produced to Kafka:', payload[0].messages);
                        }
                    });
                }
                if (updateData[0].isFutureSchedule) {
                    const payload = [{ topic: 'futureTimeScheduled', messages: JSON.stringify(updateData) }];
                    this.producer.send(payload, (error, data) => {
                        if (error) {
                            console.error('Error producing message to Kafka:', error);
                        }
                        else {
                            console.log('Message produced to Kafka:', payload[0].messages);
                        }
                    });
                }
                const mapperIds = updatedTask.map(task => task._id);
                yield task_schema_1.Task.updateMany({ _id: { $in: mapperIds } }, updatedTask[0]);
                return res.status(http_status_codes_1.StatusCodes.OK).json({
                    success: true,
                    message: 'Task updated successfully',
                    updatedTask: updatedTask[0]
                });
            }
            catch (error) {
                return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: 'Failed to update task',
                    error: error.message,
                });
            }
        });
    }
    deleteTask(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const jobId = req.params.jobId; // Extract the jobId from the request params
                // Find the task by jobId and delete it
                const deletedTask = yield task_schema_1.Task.findOneAndDelete({ jobId });
                if (!deletedTask) {
                    return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                        success: false,
                        message: 'Task not found for the provided jobId',
                    });
                }
                return res.status(http_status_codes_1.StatusCodes.OK).json({
                    success: true,
                    message: 'Task deleted successfully',
                    deletedTask,
                });
            }
            catch (error) {
                return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: 'Failed to delete task',
                    error: error.message,
                });
            }
        });
    }
}
exports.default = new TaskController();
