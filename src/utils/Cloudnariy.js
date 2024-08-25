import { v2 as cloudinary } from "cloudinary";
import fs from "fs"


// Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDNARY_CLOUD_NAME, 
        api_key: process.env.CLOUDNARY_API_KEY, 
        api_secret: process.env.CLOUDNARY_API_SCRECT // Click 'View API Keys' above to copy your API secret
    });
    

    const uploadOnCloudinary= async(localfilepath)=>{
        try {
            if (!localfilepath)return null 
             const response=  await cloudinary.uploader.upload(localfilepath,{
                resource_type:"auto"
            })
            console.log("file succcessfully uploaded", response.url);
            return response;
            }
         catch (error) {
            fs.unlinkSync(localfilepath)
            return null
            
        }

    }

export{cloudinary}