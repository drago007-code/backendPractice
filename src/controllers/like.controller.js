import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asynchandler} from "../utils/Asynchandler.js"

const toggleVideoLike = asynchandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const userId=req.user._id

    if(!(videoId||userId)){
        throw new ApiError(400,"videoId invalid");
        
    }

    const existingLike=await Like.findOne({user:userId,video:videoId})

    if(existingLike){
        await Like.deleteOne({_id:existingLike._id})

        return res.status(200).json(
            new ApiResponse(
                200,
                "unliked the video successfully"
            )
        )
    }

    const newLike=await Like.create({user:userId,video:videoId})

    return res.status(200).json(
        new ApiResponse(
            200,
            newLike,
            "like this video successfully"
        )
    )
})


const toggleCommentLike = asynchandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    const userId=req.user._id

    if(!(commentId&&userId)){
        throw new ApiError(400,"invalid");
        
    }

    const existeinglike=await Like.findOne({user:userId,comment:commentId})

    if (existeinglike) {

        await Like.deleteOne({_id:commentId._id})

        return res.status(200).json(
            new ApiResponse(
                200,
                "unliked the comment successfully"
            )
        )
        
    }

    const newLike=await Like.create({user:userId,comment:commentId})


    return res.status(200).json(
        new ApiResponse(
            200,
            "Like this comment successfully"
        )
    )

})

const toggleTweetLike = asynchandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const userId=req.user._id

    if(!(tweetId&&userId)){
        throw new ApiError(400,"invalid");
        
    }

    const existinglike=await Like.findOne({user:userId,tweet:tweetId})

    if (existinglike) {

        await Like.deleteOne({_id:tweetId._id})

        return res.status(200).json(
            new ApiResponse(
                200,
                "unliked the comment successfully"
            )
        )
        
    }

    const newLike=await Like.create({user:userId,tweet:tweetId})


    return res.status(200).json(
        new ApiResponse(
            200,
            "Like this comment successfully",
            newLike
        )
    )
}
)

const getLikedVideos = asynchandler(async (req, res) => {
    //TODO: get all liked videos

    const userId=req.params

    const likedVideos= await Like.aggregate([

        {
            $match:{
                user:userId
            }
        },
        {
            $lookup:{
                from:'videos',
                localField:'video',
                foreignField:'_id',
                as:'likedVideos'
            }
        },
        {
            $unwind:'$likedVideos'
            
        },
        {
            $project:{
                _id:0,
                videoId:'$likedVideos._id',
                title:'$likedVideo.title',
                description:'$likedVideo.description',
                url:'$likedVideo.url',
                thumbnail:'$likedVideo.thumbnail',
                likedAt:'$createdAt'
            }
        }



    ])

    if (!likedVideos || likedVideos.length === 0) {
        return res.status(404).json(new ApiResponse(
         200,   
         "No liked videos found for this user",
        ));
    }

    // Step 5: Return the list of liked videos
    res.status(200).json(new ApiResponse(
        200,
         "Liked videos retrieved successfully",
         likedVideos,
    ));


})




export{
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}