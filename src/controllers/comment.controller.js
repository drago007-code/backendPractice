import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asynchandler} from "../utils/Asynchandler.js"

const getVideoComments = asynchandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

   if (!mongoose.Types.ObjectId.isValid(videoId)) {

    throw new ApiError(200,"Video id is wrong");
    
    
   }

   const skip = (page - 1)*limit

   const comment=await Comment.find({video:videoId})
                .skip(skip)
                .limit(parseInt(limit))
                .sort({createdAt:-1})  
   if(!comment){
    throw new ApiError(400,"comment not fatched");
    
   }

                
   const totalComment=Comment.countDocuments({video:videoId})  
    
   if(!totalComment){
    throw new ApiError(200,"total comments");
    
   }


   return res.status(200).json(
    new ApiResponse(
        200,
        {
            totalComment,
            comment
        },
        "All comments get successfully"
        

    )
   )             
})

const addComment = asynchandler(async (req, res) => {
    // TODO: add a comment to a video
    const videoId=req.params

    const{userId,text}=req.body

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"comment not add")
    }
    if (!text||text.trim()==="") {
        throw new ApiError(400,"text is required");
        }

    const comment= await new Comment({
        video:videoId,
        text:text.trim(),
        user:userId,
        createdAt:Date.now()
    })

    await comment.save()

    return res.status(200).json(
        new ApiResponse(
            200,
            comment,
            "Comment add successfully"
        )
    )

})
const updateComment = asynchandler(async (req, res) => {
    // TODO: update a comment
    const commentId=req.params
    const text=req.body

    if(!commentId){
        throw new ApiError(400,"comment id is not found");
        
    }

    if (!text||text.trim()==="") {

        throw new ApiError(400,"test is required")
        
    }

    const updateComment=await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{text:text.trim()}

        },
        {new:true}
    )
    if (!updateComment) {
        throw new ApiError(400,"Not update a comment");
        
        
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            updateComment,
            "comment successfully updated"
        )
    )
})

export {
    getVideoComments,
    addComment,

}