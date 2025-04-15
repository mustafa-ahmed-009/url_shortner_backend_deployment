import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { IUser } from "../interfaces/IUser";
const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "name required"],
    },
    slug: {
      type: String,
      lowercase: true,
      default:undefined
    },
    email: {
      type: String,
      required: [true, "email required"],
      unique: true,
      lowercase: true,
    },
    phone: String,
    profileImg: String,

    password: {
      type: String,
      required: [true, "password required"],
      minlength: [6, "Too short password"],
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    newRegistrationCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    newUserVerified: Boolean,
    newUserVerificaitonCodeExpires : Date , 
    role: {
      type: String,
      enum: ["user", "manager", "admin"],
      default: "user",
    },
    active: {
      type: Boolean,
      default: true,
    },
    wishlist: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
      },
    ],
    addresses: [
      {
        id: { type: mongoose.Schema.ObjectId, },
        country: { type: String, },
        governorate : {type:String} , 
        street: { type: String, },
        phone: { type: String, },
        postalCode: { type: String, },
       details:{ type: String}

      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // Hashing user password
  this.password! = await bcrypt.hash(this.password!, 12);
  next();
});

export const User = mongoose.model("User", userSchema);

