import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'
cloudinary.config({ 
  cloud_name: process.env.CLOUDINAARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINAARY_API_KEY, 
  api_secret: process.env.CLOUDINAARY_API_SECRET
});

const cloudinaryFileUpload = async(localFilePath)=>{
try {
  if(!localFilePath) return null;
  //upload a file on cloudinary
  const response = await cloudinary.uploader.upload(localFilePath, {
    resource_type:"auto"
  })
  console.log("the file has been successfully uploaded", response.url)
  return response
  // remove the temporary save file from the server as file failed to upload on cloudinary server
  
  
} catch (error) {
  fs.unlinkSync(localFilePath) // the remove the localy save temporary file from server as the file upload is got failed  
  console.log("Error Message: ", error)
  return null; 
}

}




export {cloudinaryFileUpload};