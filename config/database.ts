import mongoose from "mongoose"
import process from 'process';
export const dbConnection = ()=>{
    const mongoUri = process.env.MONGO_URI;
      if (!mongoUri) {
        console.error("FATAL ERROR: MONGO_URI environment variable is not defined.");
        process.exit(1); 
      
    }
    mongoose.connect(mongoUri) // Now passing a guaranteed string
        .then(() => console.log("Connected to db"))
        .catch((err: any) => { 
            console.error("Database connection error:", err);
            process.exit(1);
        });


}