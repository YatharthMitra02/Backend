import { asynHandler } from "../utils/ayncHandler.js";
import { User } from "../models/user.model.js";
import { cloudinaryFileUpload } from "../utils/cloudinary.js";



const registerUser = asynHandler(async (req, res)=>{
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
const {fullname, email, userName , password} = req.body

// validate each field
if([fullname, email, userName,password ].some((field) => field?.trim() === "")
)
    {
    throw new apiError(400 , "all field are required");
}
 
// check if the user already exist or not 
const userExited = await User.findOne({
    $or: [{ userName } , { email }]
})

if(!userExited){
    throw new apiError(409 , " user with same username of email already existed ")
}

//check for the images and check for avatar that is uploaded through multer(middleware)
const avatarLocalPath = req.files?.avatar[0]?.path;
console.log(req.files);
console.log(avatarLocalPath);
/*const coverImageLocalPath = req.files?.coverImage[0]?.path;
console.log(coverImageLocalPath);*/


let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.file.coverImage.length > 0 ){
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
    fullname,
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


export {registerUser};