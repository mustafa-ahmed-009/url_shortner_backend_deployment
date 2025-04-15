import { NextFunction, Request, Response } from "express";
// Use ES6 import for express-validator types
import { validationResult } from "express-validator";

export const validationMiddleWare = (req: Request, res: Response, next: NextFunction): void => { 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Send the response, but DO NOT return it
        res.status(400).json({
            errors: errors.array()
        });
        return; 
    }
    next();
};