import { Response } from "express";

export const setCookie = (res:Response , token:string)=>{
    const isProduction = process.env.NODE_ENV === "production"
    res.cookie("token" , token,{
        httpOnly : true , 
        secure : true , 
        sameSite :"none" , 
        maxAge: 7*24*60*60*1000 , 
    })
}