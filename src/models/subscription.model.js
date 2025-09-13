import mongoose from "mongoose";

const subscriptionScheama = new mongoose.Schema({
    subscriber:{
        type: mongoose.Schema.Types.ObjectId, // one who subscribe 
        ref:"User"
    },
    channel:{
            type: mongoose.Schema.Types.ObjectId, // one whom to subscribe 
            ref:"User"
        }
}, {timestamps:true})

export const Subscription = mongoose.model("Subscription" , subscriptionScheama)