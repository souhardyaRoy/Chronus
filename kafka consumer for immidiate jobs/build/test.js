"use strict";
// public startConsuming(): void {
//     this.consumer.on('message', async (message: Message) => {
//       try {
//         const task = JSON.parse(message.value!.toString());
//         if ((task.isImmediate || (task.isFutureSchedule && !task.recursionDetails)) && !task?.recursionDetails) {
//           console.log('Received immediate task:', task.jobId);
//           const additionalArgs = [task.jobId];
//           const allArgs = task.args.concat(additionalArgs);
//           let code = await this.runChildProcess(task.command, allArgs);
//           if (code === 0) {
//             await this.updateTaskStatus(task.jobId);
//             console.error(`Task completed`);
//           } else {
//             await this.updateTaskFailedStatus(task.jobId);
//             console.error(`Child process failed and exited with code ${code}`);
//           }
//         } else if (task.isFutureSchedule && task.recursionDetails) {
//           console.log('Received future scheduled task with recursion details:', task.jobId);
//           let counter = 0;
//           const totalRecursions = task.recursionDetails.totalAmountOfRecursion;
//           const intervalInSeconds = task.recursionDetails.intervalInSeconds;
//           const additionalArgs = [task.jobId];
//           const allArgs = task.args.concat(additionalArgs);
//           const intervalId = setInterval(async () => {
//             if (counter < totalRecursions) {
//               console.log(`Executing child process for recursion ${counter + 1}/${totalRecursions}`);
//               let code = await this.runChildProcess(task.command, allArgs);
//               if (code === 0) {
//                 console.log(`Recursion ${counter + 1} completed successfully`);
//                 counter++;
//               } else {
//                 console.error(`Child process failed for recursion ${counter + 1} and exited with code ${code}`);
//                 clearInterval(intervalId); // Stop further recursions on failure
//                 await this.updateTaskFailedStatus(task.jobId);
//               }
//             } else {
//               console.log('All recursions completed');
//               clearInterval(intervalId);
//               await this.updateTaskStatus(task.jobId);
//             }
//           }, intervalInSeconds * 1000);
//         }
//       } catch (error) {
//         console.error('Error parsing message:', error);
//       }
//     });
//     // Error and connection handling remains unchanged...
//   }
