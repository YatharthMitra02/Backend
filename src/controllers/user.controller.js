import { asynHandler } from "../utils/ayncHandler.js";
import { User } from "../models/user.model.js";
import { cloudinaryFileUpload } from "../utils/cloudinary.js";
import { apiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiRespons.js";
import jwt from "jsonwebtoken";


// generating the refresh and access token for the user 
const generatingAccessandRefreshToken = async(userId)=>{
  try {
    const user = await User.findById(userId);
    const acccessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken
    user.save({validateBeforeSave:false})

    return{refreshToken, acccessToken};
    
    
  } catch (error) {
    throw new apiError(500, "something went wrong while generatuing the access and refresh token")
    
  }
}

console.log("hello world")
console.log("object")

const registerUser = asynHandler(async (req, res)=>{
  console.log("object2")
  
// algo for register a user 
// get the user detail from frontend
//validation - non Empty 
//check if the user already exist or not
// check for images check for avatar
//upload them to cloudinary
//create user object - create entry in DB
//remove password and reffresh token field from response
//check for user object
// return res


// get the user dtail from frontend

const {fullName, email, userName , password} = req.body

// validate each field
if([fullName, email, userName,password ].some((field) => field?.trim() === "")
)
    {
    throw new apiError(400 , "all field are required");
}

 
// check if the user already exist or not 
console.log(User)
const userExited = await User.findOne({
    $or: [{ userName } , { email }]
})

if(userExited){
    throw new apiError(409 , " user with same username of email already existed ")
}

//check for the images and check for avatar that is uploaded through multer(middleware)
const avatarLocalPath = req.files?.avatar[0]?.path;
console.log(req.files);
console.log(avatarLocalPath);
/*const coverImageLocalPath = req.files?.coverImage[0]?.path;
console.log(coverImageLocalPath);*/


let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
  coverImageLocalPath = req.files.coverImage[0].path;
  console.log(coverImageLocalPath);

}

// check if the avatar exist or not 
if(!avatarLocalPath){
    throw new apiError(400, "avatar is required!")
}


//upload them to the cloudinary
  const avatar = await cloudinaryFileUpload(avatarLocalPath);
  const coverImage = await cloudinaryFileUpload(coverImageLocalPath);

// check if the the avatar sucessfully uploaded to the cliodinary or not 
  if(!avatar){
    throw new apiError(400, "avatar is required!")
  }

  //create the new user using the user model 
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",  // checking if the the covrImage is not there then it does not make the data base crash
    email,
    password, 
    userName: userName.toLowerCase()
  })
  // removing the password and reffresh token from the response that is give by the database to give it to the frontend
  const createdUser = await User.findById(user._id).select(
     " -password -refreshToken"
  )
  if(!createdUser){
    throw new apiError(400 , "something went wrong while creating the user!")

  }

  // giving the response to the client or the frontend 
  return res.status(201).json(
    new ApiResponse(201, createdUser , "User Register Sucessfully")
  )

})

const loginUser = asynHandler(async(req, res) =>{
  //algo for login the user 
  // req.body->data
  //verify on the basis of email, username
  //check password
  // generate and transfer the refresh and acccess token to the client
  // send cookies

  // step-1
  const {userName, email, password} = req.body

  // trying to verify o the basis of both username ans email
  if(!(userName || email)){
    throw new apiError(400, "email  or  password is required")
  }
  //step-2
  const user =  await User.findOne({
    $or: [{ userName }, { password} ]
  })
  if(!user){
    throw new apiError(404, "The user does exist ")
  }
// step- 3
 const isPasswordCorrect = await user.isPassword(password)
 if(!isPasswordCorrect){
  throw new apiError(404 , " Invalid user credentials")
 }
 //step-4
const {refreshToken , acccessToken} = await generatingAccessandRefreshToken(user._id);

//step-5 -imp[Making and sending of the cookies] - (cokkies - are small piece of info that your backend send to your browser)

const logedinUser = await User.findById(user._id).select("-refreshToken -password")

const options = {
  httpOnly:true,
  secure:true
}
return res.status(200)
.cookie("accessToken" , acccessToken, options)
.cookie("refreshToken", refreshToken, options)
.json(
  new ApiResponse(200, {
    user: logedinUser, acccessToken,refreshToken

}, "User logged in successfully")
)
})


const logoutUser = asynHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set : { 
        refreshToken:undefined
      }
    },
      {
        new : true
      }


    
  )
  const option = {
    httpOnly:true,
    secure:true
  }

  res.status(201).
  clearCookie("accessToken", option)
  .clearCookie("refreshToken", option)
  .json(new ApiResponse(200 , {}, "User loggedout succesfully"))


  
})

const refreshAccessToken  = asynHandler(async(req,res)=>{
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new apiError(401, "unauthorized access")

  }
  const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
 const user = await user.findById(decodedToken?._id)
  if(!user){
    throw new apiError(401 , "unauthorized Refresh Token")
  }

if(incomingRefreshToken !== user?.refreshToken){
  throw new apiError(401, "The Refresh Token is expired or used ")
}

const {accessToken , newRefreshToken} = generatingAccessandRefreshToken(user._id)

const option = {
  httpOnly: true,
  secured:true
}

return res
.status(200)
.cookie("accessToken" , accessToken , option)
.cookie("accessToken" , newRefreshToken , option)
.json(
  new ApiResponse(
    200,
    {
      accessToken , refreshToken : newRefreshToken
    },
    " access token refreshed successfully"
  )
)

  
})



export {registerUser , loginUser , logoutUser, refreshAccessToken};
