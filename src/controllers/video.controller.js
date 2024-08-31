import mongoose from "mongoose";
import { asynchandler } from "../utils/Asynchandler.js";
import {Video} from "../models/video.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/Cloudnariy.js";



const getAllVideos=asynchandler( async(req,res)=>{

    const{page=1, limit=10,sortby,sorttype,userId,query}=req.query

    const filter={}

    if(query){
        filter.$or=[
            {title:{$regex:query,option:i}},
            {decription:{$regex:query,options:i}}
        ]
    }
    if (userId) {
        filter.userId=userId
        
    }

    const sort={}
    if(sortby){
        sort[sortby]=sorttype==="asc"?1:-1;
    }




    const video= await Video.find(filter)
    .sort(sort)
    .skip((page-1)*limit)
    .limit(Number(limit));

    const total = await Video.countDocuments(filter)


    return res.status(200).json(
        new ApiResponse(
            200,
            {user,total},
            "Get all videos successfully"
        )
    )




})

const publishAVideo=asynchandler( async(req,res)=>{
    
        const { title, description } = req.body;
    
        // Check if title and description are provided
      

        if ([title,description].some((field) => field?.trim === "")) {
            throw new ApiError(400, "All feilds are required")
    
        }
    
        // Safely check if video file and thumbnail exist in the request
        const localVideoFilePath = req.files?.videoFile[0]?.path;
        const localThumbnailPath = req.files?.thumbnail[0]?.path;
    
        // Ensure both video file and thumbnail are provided
        if (!(localVideoFilePath && localThumbnailPath)) {
            throw new ApiError(409, "Video file and thumbnail are required");
        }
    
        try {
            // Upload video file and thumbnail to Cloudinary (or any cloud storage)
            const videoFile = await uploadOnCloudinary(localVideoFilePath);
            const thumbnail = await uploadOnCloudinary(localThumbnailPath);
    
            // Check if the uploads were successful
            if (!(videoFile && thumbnail)) {
                throw new ApiError(400, "Video and/or thumbnail upload failed");
            }
    
            // Create a new video entry in the database
            const newVideo = await new Video({
                title,
                description,
                videoUrl: videoFile.url,
                thumbnail: thumbnail.url,
            });
    
            // Send a successful response
            return res.status(200).json(
                new ApiResponse(200, newVideo, "Video uploaded successfully")
            );
        } catch (error) {
            // Handle any errors that occur during the process
            throw new ApiError(500, "An error occurred during the video upload process");
        }
    });

    const getVideoById = asynchandler(async (req, res) => {
        const { videoId } = req.params
        //TODO: get video by id
        if (!videoId) {
            throw new ApiError(400,"invalid id")
            
        }

        const video=Video.findById(videoId)
        if(!video){
            throw new ApiError(400,"Video not found")
        }

        return res.status(200).json(
            200,
            video,
            "video found success fully"
        )
    })

    const updateVideo = asynchandler(async (req, res) => {
        const { videoId } = req.params
        //TODO: update video details like title, description, thumbnail

        const updateVideo= await Video.findByIdAndUpdate(
            videoId,
            req.body,
            {new:true}
        )
        if (!updateVideo) {

            throw new ApiError(400,"Video has not update successfully")
            
        }
        return res.status(200).json(
            new ApiResponse(
                200,
                updateVideo,
                "updateed successfully"
            )
        )
    
    })

    const deleteVideo = asynchandler(async (req, res) => {
        const { videoId } = req.params
        if (!videoId) {
            new ApiError(400,"video not found")
            
        }
        //TODO: delete video
        const video=await Video.findByIdAndDelete(videoId)

        return res.status(200).json(
            new ApiResponse(
                200,
                "Video deleted suucessfully"
            )
        )

    })
    const togglePublishStatus = asynchandler(async (req, res) => {
        const { videoId } = req.params

        if (!videoId) {

            throw new ApiError(200,"Video is not found")
            
        }

        const video=await Video.findById(videoId)

        video.publishAVideo= !video.publishAVideo

        await video.save()

        return res.status(200).json(
            200,
            video,
            "video toogle successfully"
        )
    })
    

    



export{
    getAllVideos,
    publishAVideo,
    getVideoById,
    deleteVideo,
    togglePublishStatus,
    updateVideo
}