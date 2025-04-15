import jwt, { SignOptions , JwtPayload } from "jsonwebtoken" ; 
import asyncHandler from "express-async-handler"
import ApiError from "../utils/apiError"
import { User } from "../models/userModel" ; 
import { NextFunction, Request, Response } from "express";
import { IUser } from "../interfaces/IUser";
import { setCookie } from "../utils/setCookie";
import { HydratedDocument } from "mongoose";
import bcrypt  from "bcrypt"
import { createToken } from "../utils/createToken";
import CryptoJS  from "crypto-js"
import sendEmail from "../utils/sendEmail";

export interface RequestWithUser extends Request {
  user?: HydratedDocument<IUser>;
}
export const signUp  = asyncHandler(async (req:Request , res:Response , next:NextFunction)=>{
    const user:HydratedDocument<IUser> | null  = await User.create({
        name : req.body.name , 
        email : req.body.email , 
        password : req.body.password , 
    })

    setCookie(res, createToken(next , user.id) );
    
        // res.status(201).json({
        //     status: "success",
        //     data: {
        //         user: userResponse,
        //     },
        // }); 
        (req as RequestWithUser).user = user;
        next() ; 
})



export const sendNewUserVerificationCode = asyncHandler(async (req:Request , res:Response)=>{
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedResetCode = CryptoJS.SHA256(resetCode).toString(CryptoJS.enc.Hex);
  const user = (req as RequestWithUser).user!;
  user.newUserVerificaitonCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
  user.newRegistrationCode = hashedResetCode ; 
  user.newUserVerified = false ; 
  await user.save();
  const message = `Dear ${user.name},

Welcome to E-Shop! To complete your registration, please verify your email address using the following code:

Verification Code: ${resetCode}

This code will expire in 10 minutes.

If you didn't create an account with E-Shop, please ignore this email or contact our support team.

Thank you for choosing E-Shop!

Best regards,
The E-Shop Team`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset code (valid for 10 min)",
      message,
    });
    console.log(hashedResetCode);

  } catch (err) {
    user.newRegistrationCode = undefined;
    user.newUserVerificaitonCodeExpires = undefined;
    user.newUserVerified = undefined;

    await user.save();
 throw new ApiError("There is an error in sending email", 500);

 
  }
  res.status(200).json({
    status: "success",
    message: "verification  code has been sent to the email ",
  });
})

export const verifyNewUserRegistrationCode = asyncHandler(async (req, res, next) => {
  const verificationCode = req.body.verificationCode
  const hashedResetCode = CryptoJS.SHA256(verificationCode).toString(CryptoJS.enc.Hex);
  
  const user = await User.findOne({
    newRegistrationCode: hashedResetCode,
    newUserVerificaitonCodeExpires: { $gt: Date.now() },
  });
  console.log(hashedResetCode);
  
  if (!user) {
  throw new ApiError("verifcation code is invalid or expired", 500);
  }
  user.newUserVerified = true;
  user.newUserVerificaitonCodeExpires = undefined ; 
  user.newUserVerified = undefined;
  await user.save();
  res.status(200).json({
    status: "you have been sucessfully verified ",
  });
});    

export const login  = asyncHandler(async (req:Request , res:Response , next:NextFunction)=>{
const user = await User.findOne({
    email:req.body.email 
})
if (!user || !(await bcrypt.compare(req.body.password, user.password!))) {
    return next(new ApiError("incorrect email or password", 401));
  }

  setCookie(res, createToken(next , user.id) );
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
};

res.status(201).json({
    status: "success",
    data: {
        user: userResponse,
    },
}); 
})


interface DecodedToken extends JwtPayload {
  id: string; 
}

// --- The Authenticate Middleware ---
export const authenticate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // Otherwise, check for Bearer token in Authorization header
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new ApiError(
        'You are not logged in. Please login to get access.',
        401
      )
    );
  }

  // Check if JWT_SECRET is defined (crucial for security)
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
      console.error("FATAL ERROR: JWT_SECRET environment variable is not defined.");
      // Use a generic error message for the client
      return next(new ApiError("Authentication configuration error.", 500));
  }

  try {
    // 2) Verify token
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken; 
    console.log(decoded);
    
    if (!decoded.id) {
         return next(new ApiError('Invalid token payload.', 401));
    }



    // 3) Check if user exists
    // Use HydratedDocument<IUser> for full Mongoose document type
    const currentUser: HydratedDocument<IUser> | null = await User.findById(decoded.id);

    if (!currentUser) {
      return next(
        new ApiError(
          'The user belonging to this token no longer exists.',
          401
        )
      );
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.passwordChangedAt) {
      // Ensure decoded.iat exists (it should for standard JWTs)
      if (decoded.iat) {
         const passChangedTimestamp = Math.floor(
            currentUser.passwordChangedAt.getTime() / 1000
         );

         // Password changed after token was issued
         if (passChangedTimestamp > decoded.iat) {
            return next(
              new ApiError(
                'User recently changed password. Please log in again.',
                401
              )
            );
         }
      } else {
          // This case should be rare if the token was generated correctly
           return next(new ApiError('Invalid token: Missing issued-at time.', 401));
      }
    }

    // Grant access - Attach user to the request object
    // This requires the Express Request interface to be extended (see above)
    (req as RequestWithUser).user = currentUser;
  
    next();

  } catch (error) {
    console.log(error);
    
    // Handle JWT verification errors (e.g., expired token, invalid signature)
    if (error instanceof jwt.TokenExpiredError) {
        return next(new ApiError('Your session has expired. Please log in again.', 401));
    }
     if (error instanceof jwt.JsonWebTokenError) {
        return next(new ApiError('Invalid token. Please log in again.', 401));
    }
    // Handle other potential errors
    return next(new ApiError('Authentication failed.', 401));
  }
});


export const allowedTo = (...roles:string[]) =>
    asyncHandler(async (req:Request, res:Response, next:NextFunction) => {
      // 1) access roles
      // 2) access registered user (req.user.role)
      if (!roles.includes((req as RequestWithUser).user!.role)) {
        throw next(
          new ApiError("You are not allowed to access this route", 403)
        );
      }
      next();
    });
export const forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findOne({
      email: req.body.email,
    });
    if (!user) {
    throw  new ApiError(`there is no user with email ${req.body.email}`, 404)
    }
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedResetCode = CryptoJS.SHA256(resetCode).toString(CryptoJS.enc.Hex);
    user.passwordResetCode = hashedResetCode;
    // Add expiration time for password reset code (10 min)
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.passwordResetVerified = false;
    await user.save();
    const message = `Hi ${user.name},\n We received a request to reset the password on your E-shop Account. \n ${resetCode} \n Enter this code to complete the reset. \n Thanks for helping us keep your account secure.\n The E-shop Team`;
    try {
      await sendEmail({
        email: user.email,
        subject: "Your password reset code (valid for 10 min)",
        message,
      });
      console.log(hashedResetCode);

    } catch (err) {
      user.passwordResetCode = undefined;
      user.passwordResetExpires = undefined;
      user.passwordResetVerified = undefined;
  
      await user.save();
   throw new ApiError("There is an error in sending email", 500);
    }
    res.status(200).json({
      status: "success",
      message: "reset code has been sent to the email ",
    });
    // await user.save();
    // return next(new ApiError('There is an error in sending email', 500));
  });



  export const verifyResetCode = asyncHandler(async (req, res, next) => {
    const resetCode = req.body.resetCode
    const hashedResetCode = CryptoJS.SHA256(resetCode).toString(CryptoJS.enc.Hex);
    
    const user = await User.findOne({
      passwordResetCode: hashedResetCode,
      passwordResetExpires: { $gt: Date.now() },
    });
    console.log(hashedResetCode);
    
    if (!user) {
    throw new ApiError("reset code is invalid or expired", 500);
    }
    user.passwordResetVerified = true;
    await user.save();
    res.status(200).json({
      status: "success",
    });
  });    

  export const logout = asyncHandler(async (req, res) => {
    // Clear the cookie with all the same options used when setting it
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0), // Past date
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax', 
      path: '/',
      domain: process.env.NODE_ENV === "production" ? '.yourdomain.com' : undefined
    });
  
    res.status(200).json({
      status: "success",
      message: "Logged out successfully"
    });
  });

  export const resetPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
   throw   new ApiError(`No user with email ${req.body.email}`, 404);
    }
  
    if (!user.passwordResetVerified) {
  throw    new ApiError("Reset code not verified", 400);
    }
  
    user.password = req.body.newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;
  
    await user.save();
 
    // Set HTTP-only cookie
    setCookie(res, createToken(next , user.id));
  
    res.status(200).json({
      status: "success",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  });
  
  
  export const checkAuth = (req:Request, res:Response) => {
    try {
      const user = (req as RequestWithUser).user!;
      const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
    };
    
    res.status(201).json({
        status: "success",
        data: {
            user: userResponse,
        },
    }); 
    } catch (error:any) {
      console.log("Error in checkAuth controller", error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
