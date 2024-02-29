import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "./user.schema"; // Import IUser interface from user model file
import { boolean } from "joi";

// Define interface for Task document
export interface ITask extends Document {
    jobId: string;
    email: string;
    command: string;
    taskStatus ?:boolean;
    args: string[];
    isJobFailed?: boolean;
    isRecurring: boolean;
    isImmediate?: boolean;
    recursionDetails?: {
        totalAmountOfRecursion?: number;
        intervalInSeconds?: number;
    };
    isFutureSchedule?: boolean;
    futureTimeAndDate?: string;
    // Reference to User schema
    user: IUser['_id']; // This will store the ObjectId of the user
}

// Define the Mongoose schema for Task
const TaskSchema: Schema = new Schema({
    jobId: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
    },
    command: {
        type: String,
        required: true,
    },
    args: {
        type: [String],
        required: true,
    },
    isJobFailed: {
        type: Boolean,
        required: false,
        default: false
    },
    isRecurring: {
        type: Boolean,
        required: true,
    },
    isImmediate: {
        type: Boolean,
        required: true,
    },
    recursionDetails: {
        _id:false,
        type: {
            totalAmountOfRecursion: { type: Number, default: null },
            intervalInSeconds: { type: Number, default: null },
        },
        default: null,
    },
    isFutureSchedule: {
        type: Boolean,
        default: false
    },
    taskStatus :{
        type : Boolean,
        required:false,
        default :false,
    },
    futureTimeAndDate: {
        type: String,
        default: null
    },
    // Reference to User schema
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User' // This should match the model name of your User schema
    }
});

// Define and export the Task model
export const Task = mongoose.model<ITask>("Task", TaskSchema);
