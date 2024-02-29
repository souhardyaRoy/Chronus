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
const task_schema_1 = require("./src/schema/task.schema");
const mongoose_1 = __importDefault(require("mongoose"));
class ScheduledTaskConsumer {
    constructor() {
        mongoose_1.default.set('strictQuery', false);
        mongoose_1.default.connect("mongodb://127.0.0.1:27017/Chronos", {}).then(() => {
            console.log("Connected to MongoDB");
        }).catch((err) => {
            console.error("Error connecting to MongoDB", err);
        });
        const consumerOptions = {
            kafkaHost: "localhost:9092",
            groupId: "my-group",
            autoCommit: true,
            autoCommitIntervalMs: 5000,
            sessionTimeout: 15000,
            protocol: ["roundrobin"],
            fromOffset: "latest",
        };
        this.consumer = new kafka_node_1.ConsumerGroup(consumerOptions, "futureTimeScheduled");
        const kafkaClient = new kafka_node_1.KafkaClient({ kafkaHost: "localhost:9092" });
        this.producer = new kafka_node_1.Producer(kafkaClient);
    }
    startConsuming() {
        this.consumer.on("message", (message) => __awaiter(this, void 0, void 0, function* () {
            try {
                const task = JSON.parse(message.value.toString());
                if (task.isFutureSchedule) {
                    console.log("Received scheduled task:", task);
                    const futureTimeAndDate = task.futureTimeAndDate;
                    console.log("futureTimeAndDate:", futureTimeAndDate); // Add this line
                    const dateObject = new Date(futureTimeAndDate + " UTC");
                    // Check if the date is valid
                    if (isNaN(dateObject.getTime())) {
                        console.error("Invalid date format:", futureTimeAndDate);
                        return;
                    }
                    const epochTimestamp = dateObject.getTime();
                    const epochTimestampInSeconds = Math.floor(epochTimestamp / 1000);
                    const currentDateAndTime = new Date();
                    const currentEpochTimestampInSeconds = Math.floor((currentDateAndTime.getTime() + 5 * 60 * 60 * 1000 + 30 * 60 * 1000) / 1000);
                    const dif = epochTimestampInSeconds - currentEpochTimestampInSeconds;
                    console.log(dif);
                    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        const pipeline = [
                            {
                                $match: {
                                    jobId: task.jobId, // Use task.jobId instead of Task.jobId
                                }
                            }
                        ];
                        const currentTasks = yield task_schema_1.Task.aggregate(pipeline);
                        console.log("currentTasks :", currentTasks);
                        const currentTask = currentTasks[0];
                        console.log("currentTask ", currentTask);
                        console.log("current Task  ", currentTask === null || currentTask === void 0 ? void 0 : currentTask.futureTimeAndDate, "    old task   ", task.futureTimeAndDate);
                        if (currentTask && currentTask.futureTimeAndDate === task.futureTimeAndDate) {
                            const payload = [{ topic: "immidiateNoRecur", messages: JSON.stringify(task) }];
                            this.producer.send(payload, (error, data) => {
                                if (error) {
                                    console.error("Error producing message to Kafka:", error);
                                }
                                else {
                                    console.log("Message produced to Kafka:", payload[0].messages);
                                }
                            });
                        }
                        else {
                            console.log("Current task does not match received task. Not producing message to Kafka.");
                        }
                    }), dif * 1000); // Convert dif from seconds to milliseconds
                }
            }
            catch (error) {
                console.error("Error parsing message:", error);
            }
        }));
        this.consumer.on("error", (err) => {
            console.error("Error with Kafka consumer:", err);
        });
        process.on("SIGINT", () => {
            this.consumer.close(true, () => {
                process.exit();
            });
        });
    }
}
// Usage
const scheduledTaskConsumer = new ScheduledTaskConsumer();
scheduledTaskConsumer.startConsuming();
