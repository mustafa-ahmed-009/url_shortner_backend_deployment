import { NextFunction } from "express";
import ApiError from "./apiError";
import { SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken"

export const createToken = (next:NextFunction,userId:string) : string  =>{
     const jwtSecret = process.env.JWT_SECRET;
        const jwtExpiresIn = process.env.JWT_EXPIRES_IN;
        if (!jwtSecret) {
            console.error("FATAL ERROR: JWT_SECRET environment variable is not defined.");
            // Throwing an error is often better here, caught by asyncHandler
            // or call next() with a specific error for the client
            throw new ApiError("Server configuration error [JWT Secret Missing]. Please contact administrator.", 500);        }
        if (!jwtExpiresIn) {
            console.error("FATAL ERROR: JWT_EXPIRES_IN environment variable is not defined.");
            throw new ApiError("Server configuration error [JWT Expiry Missing]. Please contact administrator.", 500);        }
        // --- End Check ---
        const tokenPayload = { id: userId }; 
        const tokenOptions: SignOptions = { 
            expiresIn: parseInt(jwtExpiresIn)
        };
        
        const token = jwt.sign(tokenPayload, jwtSecret, tokenOptions);
console.log(token);

   return   token ; 
}