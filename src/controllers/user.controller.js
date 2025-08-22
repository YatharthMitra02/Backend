import { asynHandler } from "../utils/ayncHandler.js";



const registerUser = asynHandler(async (req, res)=>{
    res.status(200).json({
        message : "ok"
    })


})

export {registerUser};