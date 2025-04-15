import { Request } from 'express';
import mongoose, { Document, Types } from 'mongoose';

 interface IAddress {
    id?: Types.ObjectId; // Mongoose usually handles this, optional here
    country?: string;
    governorate?: string;
    street?: string;
    phone?: string;
    postalCode?: string;
    details?: string;
}

 interface IUser extends Document {
    name: string;
    slug?: string ; // Optional based on schema
    email: string;
    phone?: string;
    profileImg?: string;
    password?: string; // Make optional as it's often excluded/handled separately
    passwordChangedAt?: Date;
    passwordResetCode?: string;
    passwordResetExpires?: Date;
    passwordResetVerified?: boolean;
    role: 'user' | 'manager' | 'admin'; // Use literal types for enums
    active: boolean;
    wishlist?: Types.ObjectId[]; // Array of ObjectIds referencing 'Product'
    addresses?: IAddress[];      // Array of address objects
    // Timestamps are added by Mongoose, but you can include them if needed often
    createdAt?: Date;
    updatedAt?: Date;

    // You might add instance methods here if you define them on the schema
    // e.g., comparePassword(candidatePassword: string): Promise<boolean>;
}
declare global {
    namespace Express {
        interface Request {
            user?:IUser 
        }}

}