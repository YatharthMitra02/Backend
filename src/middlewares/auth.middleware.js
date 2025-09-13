
import { User } from "../models/user.model";
import { apiError } from "../utils/apiError";
import { asynHandler } from "../utils/ayncHandler";
import jwt from "jsonwebtoken"

export const verifyJWT = asynHandler(async(req , _ , next)=>{
   try {
     const token  = req.cookies?.accessToken || req.header("Authorization")?.
     replace("Bearer " , "")
     if(!token){
         throw new apiError(401 , "unauthorized request")
     }
     const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN)
     const user = await User.findById(decodedToken?._id).select("-refreshToken -password")
  // ek chota sa discussion hoga frontend ke liye 
     if(!user){
         throw new apiError(401 , "invalid acess token ")
     }
     req.user = user;
     next()
   } catch (error) {
    throw new apiError(401, error?.message || "Invalid access token")
    
   }
    

})