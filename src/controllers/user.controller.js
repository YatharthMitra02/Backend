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
 const user = await User.findById(decodedToken?._id)
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
const changeUserPassword = asynHandler(async(req , res)=>{
  const {oldPassword , newPassword} = req.body
  /* if we also want a confirm password in the frontend
  const {oldPassword , newPassword, confirmPassword} = req.body
  if(!(confirmPassword === newPassword)){
  throw new apiError(401 , "Wrong confirm password field")
  }*/
  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPassword(oldPassword)
  if(!isPasswordCorrect){
    throw new apiError(401, "Wrong password ")
  }

  user.password = newPassword
  await user.save({validateBeforeSave:false}) //await because iti s changes in the database which takes some time

  return res
  .status(200)
  .json(new ApiResponse(200, {} ,"Password change successfully"))
})
const getCurrentUser = asynHandler(async(req , res)=>{
  return res.status(200)
  .json(200 , req.user , "current user fetched successfully")
})


const updateAccountDetail = asynHandler(async(req , res)=>{

  const{newfullName , newEmail}  = req.body
  if(!newEmail || !newfullName){
    throw new apiError(401 , "All fields are required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        email : newEmail,
        fullName : newfullName
      }
    },
    {new:true}
  ).select("-password")
  return res.status(200)
  .json(new ApiResponse(200, user , "Account detail updated successfully"))
})

const updateUserAvatar = asynHandler(async(req, res)=>{
  const localFilePath = req.file?.path
  if(!localFilePath){
    throw new apiError("Please upload  the avatar file")
  }

 const Avatar =  await cloudinaryFileUpload(localFilePath)

 if(!Avatar.url){
  throw new apiError(" error while uploading the Avatar file")
 }

const user = await User.findByIdAndUpdate(
  req.user?._id,
  {
    $set:{
      avatar : Avatar.url
    }
  },
  {new:true}
).select("-password")
return res.
status(200)
.json(new ApiResponse(200, user, "avatar updated sucessfully")

)
})
 

const updateUserCoverImage = asynHandler(async(req,res) =>{
  const localFilePath = req.file?.path
  if(!localFilePath){
    throw new apiError(400,"please upload the coverImage file")

  }

  const coverImage = await cloudinaryFileUpload(localFilePath)
  if(!coverImage.url){
    throw new apiError(400,"Error while uploading the coverImage to cloudinary")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      coverImage: coverImage.url

    },
    {new: true}
  ).select("-password")
  return res
.status(200)
.json(new ApiResponse(200 , user , "CoverImage updated sucessfully"))

})

const getUserProfileDetail = asynHandler(async(req,res)=>{
  const {username} = req.params

  if(!username?.trim()){
    throw new apiError(400, "username is missing")
  }

  const channel = await User.aggregate([{
    $match:{
      username: username?.toLowerCase() //stage 1 of aggregation pipeline
    }
  },
    {
      $lookup:{
        from:"subscriptions",  // stage 2 of aggregation pipeline
        localField: "_id",
        foreignField:"channel",
        as:"subscribers"

      }
    },
    {
      $lookup:{
        from:"subscriptions",      // stage 3 of aggreagtion pipeline
        localField:"_id",
        foreignField:"subscriber",
        as:"subscriberTo"

      }
    },
    {
      $addFields:{
        subscriberCount:{         // stage 4 of aggregation pipeline
          $size : "$subscribers"
        },
        subscribedToCount:{
          $size:"$subscriberTo"
        },
        isSubscribed:{
          $cond:{
            $if: {$in:[req.user?._id , "$subscribers.subscriber"]},
            then:true,
            else:false
          }
        }
      }
    },
    {
      $project:{
        username:1,
        fullName:1,
        email:1,
        avatar:1,
        coverImage:1,
        isSubscribed:1,
        subscribedToCount:1,
        subscriberCount:1
      }
    }



  ])

  if(!channel?.length){
    throw new apiError(400, "channel does not exist")
  }

  return res.status(200)
  .json(
    ApiResponse(200, channel[0], "channel fetched sucessfully")
  )

})

const userWatchHistory = asynHandler(async(req,res)=>{
  const user = await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:" watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:{
              from:"videos",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullName:1,
                    username:1,
                    avatar:1,
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
    }

  ])
  return res.status(200)
  .json(new ApiResponse(200 , user[0].userWatchHistory, "user watchHistory fetched sucessfully"))
})



export {registerUser , 
  loginUser , 
  logoutUser,
  refreshAccessToken,
  changeUserPassword,
  getCurrentUser,
  updateAccountDetail,
  updateUserAvatar,
  updateUserCoverImage,
  getUserProfileDetail,
  userWatchHistory

    
};
