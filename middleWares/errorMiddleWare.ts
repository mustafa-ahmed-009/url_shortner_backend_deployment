import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/apiError"

const developmentErrors = (err:ApiError,res:Response) =>{
    res.status(err.statusCode).json({
        status:err.status , 
        error : err , 
        message:err.message , 
        stackt:err.stack
    })
}
const productionErrors = (err:ApiError,res:Response) =>{
    res.status(err.statusCode).json({
        status:err.status , 
        message:err.message , 
    })
}
const handleJwtInvalidSignature = () =>
    new ApiError('Invalid token, please login again..', 401);
  
  const handleJwtExpired = () =>
    new ApiError('Expired token, please login again..', 401);
export  const handlingErrorMiddleWare = (err:ApiError, req:Request, res:Response, next:NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        developmentErrors(err, res);
    } else {
      if (err.name === 'JsonWebTokenError') err = handleJwtInvalidSignature();
      if (err.name === 'TokenExpiredError') err = handleJwtExpired();
      productionErrors(err, res);
    }
  };