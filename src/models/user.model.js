import mongoose from "mongoose"
import JWT from 'jsonwebtoken'
import bcrypt from 'bcrypt'
 const userSchema = new mongoose.Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowecase:true,
            trim:true,
            index:true
        },
        email:{
            type:String,
            unique:true,
            required:true,
            lowercase:true,
            trim:true,
        },
        fullname:{
            type:String,
            require:true,
            unique:true,
            index:true,

        },
        avatar:{
            type:String, // cloudnary url lage ga
            required:true
        },
        coverImage:{
            type:String,//cloudnary url lage ga
            
        },
        watchHistory:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref:"video"
            }

        ],
        password:{
            type:String,
            required:[true , "password is necessary"]
                },
        refreshToken:{
            type:String
        }
    }
    ,{timestamps:true})

    userSchema.pre("save", async function(next){
        if(!this.isModified("password")) return next();

            this.password = await bcrypt.hash(this.password, 10)
            next()
    })
    userSchema.methods.isPassword = async function(password){
        return await bcrypt.compare(this.password, password)

    }
    userSchema.methods.generateAccessToken = function(){
        JWT.sign(
            {
                _id:this._id,
                username:this.username,
                email: this.username,
                fullname:this.fullname
            },
            process.env.ACCESS_TOKEN,
            {
                expiresIn:process.env.ACCESS_TOKEN_EXPIRY
            }

        )
    }
    userSchema.methods.generateRefreshToken = function(){
        JWT.sign({
            _id:this._id,
           

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
           expiresIn:process.env.REFRESH_TOKEN_EXPIRY 
        }
    )
    }

    export const User = mongoose.model("User", userSchema)
