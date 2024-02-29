import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from "http-status-codes";
import * as jwt from 'jsonwebtoken';
import { User } from '../schema/user.schema';
class UserValidator {

    constructor() {
        this.isUserAuthorized = this.isUserAuthorized.bind(this);
    }

    public isUserAuthorized(req: Request, res: Response, next: NextFunction) {
        try {

            const { authorization } = req.headers;
            let authToken: string;
            if (!authorization) {
                return res.status(StatusCodes.UNAUTHORIZED).json({
                    success: false,
                    message: "Authorization header is missing.",
                });
            }

            if (authorization.split(' ').length === 2 && (authorization.split(' ')[0] == 'Bearer' || authorization.split(' ')[0] == 'bearer')) {
                authToken = authorization.split(' ')[1]
            } else if (authorization.split(' ').length === 1 ){
                authToken = authorization
            } else {
                return res.status(StatusCodes.UNAUTHORIZED).json({
                    success: false,
                    message: "please provide the bearer token",
                });
            }
            jwt.verify(authToken, <string>process.env.PASSWORD_HASH, function (err: any, decoded_token: any) {
                if (err) {
                    return res.status(StatusCodes.UNAUTHORIZED).json({
                        success: false,
                        message: "You are not authorized, please login.",
                    });
                }
                if (decoded_token.role === 'admin') {
                    // authorization successful.
                    req.body.user = decoded_token._id
                    next();
                } else {
                    return res.status(StatusCodes.UNAUTHORIZED).json({
                        success: false,
                        message: "You are not authorized, please login.",
                    });
                }
            });
        } catch (error) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "something went wrong.",
            });
        }
    }

}

export default new UserValidator();
