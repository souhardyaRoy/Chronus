import { ConsumerGroup, Message, ConsumerGroupOptions } from 'kafka-node';
import { spawn, ChildProcess } from 'child_process';
import { Task, ITask } from "./src/schema/task.schema";
import mongoose from "mongoose";
import { log } from "console";
import logger from './src/logger/logger';

class KafkaConsumer {
  private consumer: ConsumerGroup;

  constructor() {
    mongoose.set('strictQuery', false);
    mongoose.connect("mongodb://127.0.0.1:27017/Chronos", {}).then(() => {
      console.log("Connected to MongoDB");
    }).catch((err: any) => {
      console.error("Error connecting to MongoDB", err);
    });

    const consumerOptions: ConsumerGroupOptions = {
      kafkaHost: 'localhost:9092',
      groupId: 'my-group',
      autoCommit: true,
      autoCommitIntervalMs: 5000,
      sessionTimeout: 15000,
      protocol: ['roundrobin'],
      fromOffset: 'latest'
    };
    this.consumer = new ConsumerGroup(consumerOptions, 'immidiateNoRecur');
    console.log('Kafka consumer connected'); // Log when the consumer is instantiated
  }

  private runChildProcess(command: string, argsArray: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, argsArray, {
        stdio: 'ignore',
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(code);
        }
      });

      child.on('error', (err) => {
        reject(err);
      });
    });
  }

  public startConsuming(): void {
    this.consumer.on('message', async (message: Message) => {
      try {
        const task = JSON.parse(message.value!.toString());

        if ((task.isImmediate || task.isFutureSchedule) && !task?.recursionDetails) {
          logger.info(`Received non recured task, the job id is : ${task.jobId}`);

          if (task.isImmediate) {
            logger.info(`The task need to be immidiately execute for the job id: ${task.jobId}`);
          }

          if (task.isFutureSchedule) {
            logger.info(`The task will execute in future, for the jobId ${task.jobId}`);
          }

          const additionalArgs = [task.jobId];
          const allArgs = task.args.concat(additionalArgs);

          let code = await this.runChildProcess(task.command, allArgs)

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
            const tasks = await Task.aggregate(pipeline).exec();
            const mapperIds = tasks.map(task => task._id);
            await Task.updateMany({ _id: { $in: mapperIds } }, tasks[0]);
            logger.info(`Task completed for job id ${task.jobId}`);
          } else {
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
            const tasks = await Task.aggregate(pipeline).exec();
            const mapperIds = tasks.map(task => task._id);
            await Task.updateMany({ _id: { $in: mapperIds } }, tasks[0]);
            logger.error(`Child process failed for job id ${task.jobId} and  exited with code ${code}`);
          }
        }
        else if (task.isFutureSchedule && task.recursionDetails) {
          logger.info(`Received future scheduled task with recursion details:  ${task.jobId}`);

          let counter = 0;
          const totalRecursions = task.recursionDetails.totalAmountOfRecursion;
          const intervalInSeconds = task.recursionDetails.intervalInSeconds;
          const additionalArgs = [task.jobId];
          const allArgs = task.args.concat(additionalArgs);

          const intervalId = setInterval(async () => {
            logger.info('Recursive Task started')
            if (counter !== totalRecursions) {
              console.log(`Executing child process for recursion ${counter + 1}/${totalRecursions}`);
              let code = await this.runChildProcess(task.command, allArgs);

              if (code === 0) {
                logger.info(`Recursion ${counter + 1} completed successfully`);
                counter++;
              } else {
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
                const tasks = await Task.aggregate(pipeline).exec();
                const mapperIds = tasks.map(task => task._id);
                await Task.updateMany({ _id: { $in: mapperIds } }, tasks[0]);
                logger.error(`Child process failed for recursion ${counter + 1} and exited with code ${code}`);
                clearInterval(intervalId); // Stop further recursions on failure
              }
            } else {
              logger.info('All recursions completed');

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
              const tasks = await Task.aggregate(pipeline).exec();
              const mapperIds = tasks.map(task => task._id);
              await Task.updateMany({ _id: { $in: mapperIds } }, tasks[0]);
              logger.info(`Task completed for job id ${task.jobId}`);
              clearInterval(intervalId);
            }
          }, intervalInSeconds * 1000);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    this.consumer.on('error', (err: Error) => {
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
