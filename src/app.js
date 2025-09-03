import express, { urlencoded } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
const app = express();
//these are the middlewares that will work everytime the user send a request 
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true,
}))
app.use(express.json({
    limit:"16kb"
}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// Routes import 
//Router as userRouter
import userRouter from './routes/user.router.js';
app.use("/api/v1/users" , userRouter)





export {app}