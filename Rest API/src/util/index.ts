import { Response } from "express";

export const  handleDuplicateKeyError = (error :any , res:Response) =>{
    if (error.code === 11000) {
        // Extract the field names from the error message
        const fieldNames = Object.keys(error.keyPattern);
        return { success: false, message: `${fieldNames.join(', ')} already exist` };
    }
   
}

export const isEmail = (email: string):boolean =>  {
    const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return regex.test(email);
};
