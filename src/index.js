import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { configDotenv } from "dotenv";

dotenv.config({
    path: './env'
})

console.log("Loaded ENV keys:", Object.keys(process.env));
console.log("MONGODB_URI:", process.env.MONGODB_URI);


connectDB();