import { Document, model, Schema } from "mongoose";
import { isEmail } from "../util/index";

export const AllowedRole = ['admin'] as const;

type Role = typeof AllowedRole[number]; 

export interface IUser extends Document {
    name: string;
    password: string;
    email: string;
    role?: Role;
}

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        minlength: 2,
        required: [true, 'Name is mandatory'], // Make name required
        trim: true,
    },
    password: {
        type: String,
        minlength: 2,
        required: [true, 'Password is mandatory'], // Make password required
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is mandatory'], // Make email required
        unique: true,
        validate: [isEmail, 'Please enter a valid email']
    },
    role: { 
        type: String,
        enum: AllowedRole,
        default: 'admin',
    }
}, {
    timestamps: true,
    versionKey: false,
});



export const User = model<IUser>('User', userSchema);
