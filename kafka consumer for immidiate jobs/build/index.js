"use strict";
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
const kafka_node_1 = require("kafka-node");
const child_process_1 = require("child_process");
const task_schema_1 = require("./src/schema/task.schema");
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("./src/logger/logger"));
class KafkaConsumer {
    constructor() {
        mongoose_1.default.set('strictQuery', false);
        mongoose_1.default.connect("mongodb://127.0.0.1:27017/Chronos", {}).then(() => {
            console.log("Connected to MongoDB");
        }).catch((err) => {
            console.error("Error connecting to MongoDB", err);
        });
        const consumerOptions = {
            kafkaHost: 'localhost:9092',
            groupId: 'my-group',
            autoCommit: true,
            autoCommitIntervalMs: 5000,
            sessionTimeout: 15000,
            protocol: ['roundrobin'],
            fromOffset: 'latest'
        };
        this.consumer = new kafka_node_1.ConsumerGroup(consumerOptions, 'immidiateNoRecur');
        console.log('Kafka consumer connected'); // Log when the consumer is instantiated
    }
    runChildProcess(command, argsArray) {
        return new Promise((resolve, reject) => {
            const child = (0, child_process_1.spawn)(command, argsArray, {
                stdio: 'ignore',
            });
            child.on('close', (code) => {
                if (code === 0) {
                    resolve(code);
                }
                else {
                    reject(code);
                }
            });
            child.on('error', (err) => {
                reject(err);
            });
        });
    }
    startConsuming() {
        this.consumer.on('message', (message) => __awaiter(this, void 0, void 0, function* () {
            try {
                const task = JSON.parse(message.value.toString());
                if ((task.isImmediate || task.isFutureSchedule) && !(task === null || task === void 0 ? void 0 : task.recursionDetails)) {
                    logger_1.default.info(`Received non recured task, the job id is : ${task.jobId}`);
                    if (task.isImmediate) {
                        logger_1.default.info(`The task need to be immidiately execute for the job id: ${task.jobId}`);
                    }
                    if (task.isFutureSchedule) {
                        logger_1.default.info(`The task will execute in future, for the jobId ${task.jobId}`);
                    }
                    const additionalArgs = [task.jobId];
                    const allArgs = task.args.concat(additionalArgs);
                    let code = yield this.runChildProcess(task.command, allArgs);
                    if (code === 0) {
                        const pipeline = [
                            {
                                $match: {
                                    jobId: task.jobId,
                                }
                            },
                            {
                                $set: { taskStatus: true }
                            }
                        ];
                        const tasks = yield task_schema_1.Task.aggregate(pipeline).exec();
                        const mapperIds = tasks.map(task => task._id);
                        yield task_schema_1.Task.updateMany({ _id: { $in: mapperIds } }, tasks[0]);
                        logger_1.default.info(`Task completed for job id ${task.jobId}`);
                    }
                    else {
                        const pipeline = [
                            {
                                $match: {
                                    jobId: task.jobId,
                                }
                            },
                            {
                                $set: { isJobFailed: true }
                            }
                        ];
                        const tasks = yield task_schema_1.Task.aggregate(pipeline).exec();
                        const mapperIds = tasks.map(task => task._id);
                        yield task_schema_1.Task.updateMany({ _id: { $in: mapperIds } }, tasks[0]);
                        logger_1.default.error(`Child process failed for job id ${task.jobId} and  exited with code ${code}`);
                    }
                }
                else if (task.isFutureSchedule && task.recursionDetails) {
                    logger_1.default.info(`Received future scheduled task with recursion details:  ${task.jobId}`);
                    let counter = 0;
                    const totalRecursions = task.recursionDetails.totalAmountOfRecursion;
                    const intervalInSeconds = task.recursionDetails.intervalInSeconds;
                    const additionalArgs = [task.jobId];
                    const allArgs = task.args.concat(additionalArgs);
                    const intervalId = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                        logger_1.default.info('Recursive Task started');
                        if (counter !== totalRecursions) {
                            console.log(`Executing child process for recursion ${counter + 1}/${totalRecursions}`);
                            let code = yield this.runChildProcess(task.command, allArgs);
                            if (code === 0) {
                                logger_1.default.info(`Recursion ${counter + 1} completed successfully`);
                                counter++;
                            }
                            else {
                                const pipeline = [
                                    {
                                        $match: {
                                            jobId: task.jobId,
                                        }
                                    },
                                    {
                                        $set: { isJobFailed: true }
                                    }
                                ];
                                const tasks = yield task_schema_1.Task.aggregate(pipeline).exec();
                                const mapperIds = tasks.map(task => task._id);
                                yield task_schema_1.Task.updateMany({ _id: { $in: mapperIds } }, tasks[0]);
                                logger_1.default.error(`Child process failed for recursion ${counter + 1} and exited with code ${code}`);
                                clearInterval(intervalId); // Stop further recursions on failure
                            }
                        }
                        else {
                            logger_1.default.info('All recursions completed');
                            const pipeline = [
                                {
                                    $match: {
                                        jobId: task.jobId,
                                    }
                                },
                                {
                                    $set: { taskStatus: true }
                                }
                            ];
                            const tasks = yield task_schema_1.Task.aggregate(pipeline).exec();
                            const mapperIds = tasks.map(task => task._id);
                            yield task_schema_1.Task.updateMany({ _id: { $in: mapperIds } }, tasks[0]);
                            logger_1.default.info(`Task completed for job id ${task.jobId}`);
                            clearInterval(intervalId);
                        }
                    }), intervalInSeconds * 1000);
                }
            }
            catch (error) {
                console.error('Error parsing message:', error);
            }
        }));
        this.consumer.on('error', (err) => {
            console.error('Error with Kafka consumer:', err);
        });
        this.consumer.on('connect', () => {
            console.log('Kafka consumer connected'); // Log when consumer is ready to consume messages
        });
        process.on('SIGINT', () => {
            this.consumer.close(true, () => {
                console.log('Kafka consumer disconnected'); // Log when consumer is disconnected
                process.exit();
            });
        });
    }
}
// Usage
const kafkaConsumer = new KafkaConsumer();
kafkaConsumer.startConsuming();
