import mongoose from "mongoose";
import { DB_name } from "../constant.js";

const connectDB = async()=>{
    try {
        console.log("MongoDB URI:", process.env.MONGODB_URI);
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_name}`);
        console.log(`\n MongoDB connected !! DB Host: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MongoDB connection error:" , error);
        process.exit(1);
        
    }
}
export default connectDB;