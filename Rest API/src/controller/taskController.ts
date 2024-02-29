import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from "http-status-codes";
import { Task, ITask } from '../schema/task.schema';
import { User } from '../schema/user.schema'; // Import the User schema
import { handleDuplicateKeyError } from '../util/index';
import path from 'path';
import fs from 'fs'
import * as kafka from 'kafka-node'
class TaskController {
    private kafkaClient = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
    private producer = new kafka.Producer(this.kafkaClient);
    constructor() {
        this.createTask = this.createTask.bind(this);
        this.getTasksForUser = this.getTasksForUser.bind(this); // Bind the method
        this.updateTask = this.updateTask.bind(this)
    }

    public async createTask(req: Request, res: Response) {
        try {
            const taskData: ITask = req.body;
            const pipeline = [
                {
                    $match: {
                        jobId: taskData.jobId,
                    }
                },
            ];
            const task = await Task.aggregate(pipeline).exec();
            if (task.length !== 0) {
                return res.status(StatusCodes.CONFLICT).json({
                    success: false,
                    message: 'Task already exists for the provided jobId',
                });
            }
            if (!path.isAbsolute(taskData.args[0])) {
                return res.status(400).json({ message: 'args must be an absolute path' });
            }
            if (!fs.existsSync(taskData.args[0])) {
                return res.status(400).json({ message: 'File does not exist' });
            }

            const newTask = await Task.create(taskData);

             if (taskData.isImmediate) {
                const payload = [{ topic: 'immidiateNoRecur', messages: JSON.stringify(taskData) }];
                this.producer.send(payload, (error, data) => {
                  if (error) {
                    console.error('Error producing message to Kafka:', error);
                  } else {
                    console.log('Message produced to Kafka: ', payload[0].topic, payload[0].messages);
                  }
                });
              }
          
              if(taskData.isFutureSchedule){
                const payload = [{ topic: 'futureTimeScheduled', messages: JSON.stringify(taskData) }];
                this.producer.send(payload, (error, data) => {
                  if (error) {
                    console.error('Error producing message to Kafka:', error);
                  } else {
                    console.log('Message produced to Kafka:',payload[0].topic, payload[0].messages);
                  }
                });
              }
 
            return res.status(StatusCodes.CREATED).json({
                success: true,
                message: 'Task created successfully',
                newTask
            });
        } catch (error: any) {
            if (error.code === 11000) {
                // Handle duplicate key error
                return res.status(StatusCodes.BAD_REQUEST).json(
                    handleDuplicateKeyError(error, res)
                );
            }
            // Handle other errors
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to create task',
                error: error.message,
            });
        }
    }

    public async getTasksForUser(req: Request, res: Response) {
        try {
            const userEmail = req.params.email; // Extract the user's email from the request params

            // Aggregation pipeline to fetch tasks for a specific user
            const tasks = await Task.aggregate([
                {
                    $lookup: {
                        from: "users", // Collection name of users
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
                return res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'Tasks not found for the user with the provided email',
                });
            }

            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Tasks retrieved successfully for user',
                tasks
            });
        } catch (error: any) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to fetch tasks for user',
                error: error.message,
            });
        }
    }

    public async updateTask(req: Request, res: Response) {
        try {
            const jobId = req.params.jobId; // Extract the jobId from the request params
            const updateData = req.body;
            if (!path.isAbsolute(updateData.args[0])) {
                return res.status(400).json({ message: 'args must be an absolute path' });
            }
            if (!fs.existsSync(updateData.args[0])) {
                return res.status(400).json({ message: 'File does not exist' });
            }
            const allowedFields = ['command', 'args', 'isImmediate', 'isRecurring', 'recursionDetails', 'isFutureSchedule', 'futureTimeAndDate'];

            // Construct update object based on fields present in request body
            const updateObject: any = {};
            allowedFields.forEach(field => {
                if (updateData.hasOwnProperty(field)) {
                    updateObject[field] = updateData[field];
                }
            });

            // Check if update object is empty
            if (Object.keys(updateObject).length === 0) {
                return res.status(StatusCodes.BAD_REQUEST).json({
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

            const updatedTask = await Task.aggregate(pipeline).exec();
            if (updatedTask.length === 0) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'Task not found for the provided jobId',
                });
            }
            if(updateData.taskStatus){
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: 'Task is already completed you can not update a completed task',
                });
            }
            if (updateData.isImmediate) {
                const payload = [{ topic: 'immidiateNoRecur', messages: JSON.stringify(updateData) }];
                this.producer.send(payload, (error, data) => {
                  if (error) {
                    console.error('Error producing message to Kafka:', error);
                  } else {
                    console.log('Message produced to Kafka:', payload[0].messages);
                  }
                });
              }
          
              if(updateData[0].isFutureSchedule){
                const payload = [{ topic: 'futureTimeScheduled', messages: JSON.stringify(updateData) }];
                this.producer.send(payload, (error, data) => {
                  if (error) {
                    console.error('Error producing message to Kafka:', error);
                  } else {
                    console.log('Message produced to Kafka:', payload[0].messages);
                  }
                });
              }
           

            const mapperIds = updatedTask.map(task => task._id);
            await Task.updateMany({ _id: { $in: mapperIds } }, updatedTask[0]);
            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Task updated successfully',
                updatedTask: updatedTask[0]
            });
        } catch (error: any) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to update task',
                error: error.message,
            });
        }
    }

    public async deleteTask(req: Request, res: Response) {
        try {
            const jobId = req.params.jobId; // Extract the jobId from the request params

            // Find the task by jobId and delete it
            const deletedTask = await Task.findOneAndDelete({ jobId });

            if (!deletedTask) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'Task not found for the provided jobId',
                });
            }

            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Task deleted successfully',
                deletedTask,
            });
        } catch (error: any) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to delete task',
                error: error.message,
            });
        }
    }


}

export default new TaskController();
