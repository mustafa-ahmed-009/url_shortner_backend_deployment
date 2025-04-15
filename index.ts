import express, { NextFunction, Request, Response } from "express";
import urlRoutes from "./routes/urlRoutes";
import authRoutes from "./routes/authRoutes";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import { dbConnection } from "./config/database";
import dotenv from "dotenv";
import ApiError from "./utils/apiError";
import { handlingErrorMiddleWare } from "./middleWares/errorMiddleWare";
import cookieParser from "cookie-parser"
dotenv.config();
const app = express();
// --- 1. Core Middleware ---
app.use(helmet());
app.use(morgan("tiny"));
app.use(cors(
    {
        origin: 'https://chatty-m2mp.vercel.app', // Allow only this domain
        methods: 'GET,POST',
        allowedHeaders: 'Content-Type,Authorization'  , 
        credentials: true  
    }
));
app.use(express.json()); // For parsing application/json
app.use(cookieParser())
// --- 2. Database Connection ---

dbConnection();

// --- 3. API Routes ---
app.use("/u", urlRoutes); // Good practice to version your API
app.use("/api/v1/auth", authRoutes); // Good practice to version your API
// // --- Undefined Route Handler (404) ---
// app.all("*", (req: Request, res: Response, next: NextFunction) => {
//     // Create an error object
//     const err = new ApiError(`Can't find ${req.originalUrl} on this server!`, 404);
//     // Pass it to the global error handling middleware
//     next(err);
// });

app.use(handlingErrorMiddleWare);
// --- 5. Global Error Handling Middleware ---
// This MUST come AFTER all other middleware and routes
// app.use(globalError); // Uncomment and use your typed global error handler

// --- 6. Start the Server ---
const PORT = process.env.PORT || 3000; // Use environment variable for port
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});