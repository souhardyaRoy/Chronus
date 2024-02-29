import { ConsumerGroup, ConsumerGroupOptions, KafkaClient, Message, Producer } from "kafka-node";
import {Task,ITask} from "./src/schema/task.schema";
import mongoose from "mongoose";
import { log } from "console";

class ScheduledTaskConsumer {
  private consumer: ConsumerGroup;
  private producer: Producer;

  constructor() {
    mongoose.set('strictQuery', false);
    mongoose.connect("mongodb://127.0.0.1:27017/Chronos", {}).then(() => {
      console.log("Connected to MongoDB");
    }).catch((err: any) => {
      console.error("Error connecting to MongoDB", err);
    });

    const consumerOptions:ConsumerGroupOptions = {
      kafkaHost: "localhost:9092",
      groupId: "my-group",
      autoCommit: true,
      autoCommitIntervalMs: 5000,
      sessionTimeout: 15000,
      protocol: ["roundrobin"],
      fromOffset: "latest",
    };

    this.consumer = new ConsumerGroup(consumerOptions, "futureTimeScheduled");
    const kafkaClient = new KafkaClient({ kafkaHost: "localhost:9092" });
    this.producer = new Producer(kafkaClient);
  }

  public startConsuming(): void {
    this.consumer.on("message", async (message: Message) => {
      try {
        const task = JSON.parse(message.value!.toString());
  
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
  
          setTimeout(async () => {
            const pipeline = [
              {
                  $match: {
                      jobId: task.jobId, // Use task.jobId instead of Task.jobId
                  }
              }
          ];
          
          const currentTasks = await Task.aggregate(pipeline);
          console.log("currentTasks :",currentTasks);
          
          const currentTask = currentTasks[0];
            console.log("currentTask ", currentTask);
            console.log("current Task  ", currentTask?.futureTimeAndDate, "    old task   ", task.futureTimeAndDate);
  
            if (currentTask && currentTask.futureTimeAndDate === task.futureTimeAndDate) {
              const payload = [{ topic: "immidiateNoRecur", messages: JSON.stringify(task) }];
 
              this.producer.send(payload, (error, data) => {
                if (error) { 
                  console.error("Error producing message to Kafka:", error);
                } else {
                  console.log("Message produced to Kafka:", payload[0].messages);
                }
              });
            } else {
              console.log("Current task does not match received task. Not producing message to Kafka.");
            }
          }, dif * 1000); // Convert dif from seconds to milliseconds
        }

        
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });
  
    this.consumer.on("error", (err: any) => {
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
