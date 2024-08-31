import { ApiError } from "../utils/ApiError.js";
import { asynchandler } from "../utils/Asynchandler.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudnariy.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { Subscription } from "../models/subcription.model.js";
import mongoose from "mongoose";

const generateAccessAndRefereshTokens = async(userId)=>{
    const user= await User.findById(userId)
    const accessToken= user.generateAccessToken()
    const refreshToken=user.generateRefreshToken()
    user.refreshToken= refreshToken
    await user.save({validateBeforeSave:false})

    return{accessToken,refreshToken}
}


const registeruser = asynchandler(async (req, res) => {
    //get user details
    const { fullname, email, username, password } = req.body
   // console.log("email:", email);


    //validation - empty
    if ([fullname, email, username, password].some((field) => field?.trim === "")) {
        throw new ApiError(400, "All feilds are required")

    }


    //check your already exists with username or email
    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (existedUser) {
        throw new ApiError(409, "User already existed")

    }






    //check for image also avatar
    console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(409, "Avatar is required");

    }
    //upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(500, "Avatar is required")
    }


    //create user object --create entry in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "User is not created because of server error");

    }
    return res.status(201).json(
        new ApiResponse(201, createdUser, "Uesr is registered successfully")
    )


    //remove password ann refresh token field from response
})

const loginUser = asynchandler(async(req , res)=>{
    // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie
  const{email, username,password}=req.body
  if(!(username||email)){
      throw new ApiError(201,"username or email required");
      
  }

  const user = await User.findOne({
      $or: [{username}, {email}]
  })
  if(!user){
      throw new ApiError(200,"user does not exist")
  }
  const validpassword=user.isPasswordCorrect(password);
  if (!validpassword) {
      throw new ApiError(400,"Password is not correct");
      
      
  }
  const{accessToken,refreshToken}=await generateAccessAndRefereshTokens(user._id)

  const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

  const options={
      httpOnly:true,
      secure:true

  }

  return res.status(200).cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
      new ApiResponse( 
          200,
          {
              user:loggedInUser,accessToken,refreshToken
          },
          "user loggedIn")
     
  )


  
})

const loggedOut=asynchandler(async(req,res)=>{
    User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken:1
            }
        },
        {
            new:true
        }

    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))

})

const refreshTokenAccess= asynchandler(async(re,res)=>{
    //incomingrefreshToken
    const incomingRefreshToken=req.cookie?.refreshToken||req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(400,"Unathorized Request");
        }
    //check

    //decode token
    try {
        const decodedRefreshToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SCRECT)
        const user=User.findById(decodedRefreshToken?._id)
        if (!user) {
            throw new ApiError(400,"Invalid token");
        }
            
        
    
        //match
        if(!incomingRefreshToken!==user.refreshToken){
            throw new ApiError(400,"invalid reuest");
            
        }
        //send response
        const {accessToken,newrefreshToken}=generateAccessAndRefereshTokens(user._id)
    
        const options={
            httpOnly:true,
            secure:true
        }
        res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newrefreshToken},
                "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
        
    }
        
    
})
const changeCurrentPassword= asynchandler(async(req,res)=>{
    const {oldPssword,newPassword} =req.body

    const user=await User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPssword)
    if (!isPasswordCorrect) {
        throw new ApiError(400,"Password is NOT CORRECT")

        
    }
    user.password=newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200).json(
        new ApiResponse(
            200,
            {accessToken,refreshToken:newrefreshToken},
            "Password has changed"
        )
    )


})

const getCurrentUser=asynchandler(async(req,res)=>{
    return res.status(200).json(
        new ApiResponse(
            200,
            req.user,
            "Current user is this"
        )
    )
})

const updateAccountDetails=asynchandler( async(req,res)=>{
    const{email,fullname}=req.body
    if(!(email||fullname)){
        throw new ApiError(400,"email and password required")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
    {
        $set:{
            email,
            fullname
        }
    },{
        new:true
    })
    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "user info updated"
        )


    )
})


const updateUserAvatar=asynchandler( async(req,res)=>{
    const localFilePath=req.file?.path
    if(!localFilePath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const avatar=await uploadOnCloudinary(localFilePath)
    if(!avatar.url){
        throw new ApiError(400,"error while uploading avatar ");
        
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            },
            
        },
        {
            new:true
        }
    ).select("-password")

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Avatar is successfully updated"
        )
    )
})
const updateUserCoverImage=asynchandler( async(req,res)=>{
    const localFilePath=req.file?.path
    if(!localFilePath){
        throw new ApiError(400,"CoverImage file is missing")
    }
    const CoverImage=await uploadOnCloudinary(localFilePath)
    if(!avatar.url){
        throw new ApiError(400,"error while uploading CoverImage ");
        
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                CoverImage:CoverImage.url
            },
            
        },
        {
            new:true
        }
    ).select("-password")

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "CoverImage is successfully updated"
        )
    )
})

const getUserChannelProfile=asynchandler(async(req,res)=>{

    const{username}=req.params

    if(!username?.trim){
        throw new ApiError(400,"username is missing")
    }

    const channel=User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localpath:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subsciberCount:{
                    $size:"$subscribers"
                },
                channelSubscribedToCount:{
                    $size:"subscribedTo"
                }
            }
            
        },
        {
            isSubscribed:{
                $cond:{
                    if:{$in:[req.user?._id, "$subscribers.subscriber"]},
                    then:true,
                    else:false
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                email:1,
                avatar:1,
                coverImage:1,
                subsciberCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
            }
        }
    ])
    if (!channel?.length) {
        throw new ApiError(400,"channel dose not exist")
        
    }
    return res.status(200).json(
        new ApiResponse(
            200,
            channel[0],
            "user channel fetch successfully"
        )
    )

})

const getWatchHistory= asynchandler(async(req,res)=>{
    const user=User.aggregate([
        {
            $match:{
                _id:mongoose.Types.ObjectId(req.user._id)
            }

        },
        {
            $lookup:{
                from:"videos",
                localField:"watchhistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1,
                                    }
                                }
                            ]
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

    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            user[0],
            "watch history fatched"
        )
    )


})







export { registeruser,
    loginUser,
    loggedOut,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    refreshTokenAccess,
    getUserChannelProfile,
    getWatchHistory,
 }