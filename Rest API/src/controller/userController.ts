import { Request, Response, NextFunction } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { StatusCodes } from "http-status-codes";
import { IUser, User } from '../schema/user.schema'
import { handleDuplicateKeyError } from '../util/index';

class UserController {

    constructor() {
        this.createUser = this.createUser.bind(this);
        this.loginUser = this.loginUser.bind(this)
    }

    public async createUser(req: Request, res: Response) {
        try {
            // Extract user data from the request body
            const userData: IUser = req.body;
            // Hash the password synchronously
            const hash = await bcrypt.hash(userData.password, 10);
            // Update the password with the hashed value
            userData.password = hash;
            // Create the user
            const newUser = await User.create(userData);
            return res.status(StatusCodes.CREATED).json({
                success: true,
                message: 'User created successfully',
                user: newUser,
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
                message: 'Failed to create user',
                error: error.message,
            });
        }
    }

    public async loginUser(req: Request, res: Response) {
        // this is authentication.
        try {
            const {email, password} = req.body;
            const _user = await User.findOne({email: email});
            if(_user) {
                const match = await bcrypt.compare(password, _user.password);//dusra wala chupaya wala jo db m h
                if(match) {
                    // generate token.
                    const secret_key = <string>process.env.PASSWORD_HASH;
                    const payload = {_id: _user._id, role: _user.role};
                    const token = jwt.sign(payload, secret_key, { expiresIn: 60 * 60 });
                    return res.status(StatusCodes.OK).json(
                        {token:token}
                    );
                } else {
                    return res.status(StatusCodes.UNAUTHORIZED).json(
                        {
                            message:"Username/password invalid",
                            success: false
                        }
                    )
                }
            } else {
                // username was wrong, it does not exist in the database.
                return res.status(StatusCodes.UNAUTHORIZED).json(  
                    {
                        message:"Username/password invalid",
                        success: false
                    }
                )
            }
        } catch (error:any) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to login user',
                error: error.message,
            });
        }
    }
    
    
}

export default new UserController();
