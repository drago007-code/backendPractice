import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asynchandler} from "../utils/Asynchandler.js"


const createPlaylist = asynchandler(async (req, res) => {
    const {name, description} = req.body

    const userId=req.user._id

    if (!name) {
        throw new ApiError(400,"name video is wrong")
        
    }
    
    const exsitingPlayList=await Playlist.findOne({name,user:userId})

    if (!exsitingPlayList) {

        throw new ApiError(400,"Playlist already present")
        
    }

    const newPlayList=await Playlist.create({
        name,
        description,
        user:userId,
        videos:[]
    })

    return res.status(200).json(
        new ApiResponse(
            200,
            {Playlist:newPlayList},
            "Successfully create the PlayList"
        )
    )

    //TODO: create playlist
})

const getUserPlaylists = asynchandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!userId) {
        throw new ApiError(400,"user not found");
        
        
    }

    const playList=await Playlist.aggregate([
        {
            $match:{
                user:userId,
            }
        },
        {
            $lookup:{
                from:'videos',
                localField:'videos',
                foreignField:'_id',
                as:'videoDetails'
            }
        },
        {
            $project:{
                name:1,
                description:1,
                videoDetails:1,
                createdAt:1,
                updatedAt:1
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            playList,
            "Get all user playlists"
        )
    )
})

const getPlaylistById = asynchandler(async (req, res) => {
    const {playlistId} = req.params

    if (!playlistId) {

        throw new ApiError(400,"playlistid is not correct")
        
    }
    //TODO: get playlist by id

    const playList=await Playlist.aggregate([
        {
            $match:{
                _id:playlistId
            }
        },
        {
            $lookup:{
                from:'videos',
                localField:'videos',
                foreignField:'_id',
                as:'videoDetails',
               
            }
        },
        {
            $lookup: {
                from: "users", // The User collection to get the owner's details
                localField: "owner", // Field from the Playlist collection
                foreignField: "_id", // Field from the User collection
                as: "ownerDetails" // The name of the array field to add to the documents
            }
        },
        {
            $unwind: "$ownerDetails" // Unwind the ownerDetails array to get an object instead of an array
        },
        {
            $project:{

                name:1,
                description:1,
                videoDetails:1,
                ownerDetails: {
                    _id: 1,
                    name: 1,
                    email: 1
                },
                
                createdAt:1,
                updatedAt:1

            }
        }

    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            playList,
            "Get all user playlists"
        )
    )

})

const addVideoToPlaylist = asynchandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!(playlistId&&videoId)) {

        throw new ApiError(400,"Playlist and videoId are required")
        
    }

    const playList=Playlist.findById(playlistId)

    if (!playList) {

        throw new ApiError(200,"Playlist not found");
        
        
    }
    if (playList.videos.includes(videoId)) {
        throw new ApiError(200,"video already exist");
        
        
    }

    playList.videos.push(videoId)

    playList.videos.save()


    return res.status(200).json(
        new ApiResponse(
            200,
            playList,
            "video has been added"
        )
    )
})

const removeVideoFromPlaylist = asynchandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if (!(playlistId&&videoId)) {
        throw new ApiError(400,"playlistid and vidoeId required");
        
        
    }

    const playList=await Playlist.findById(playlistId)

    if (!playList) {
        throw new ApiError(400,"playlist not found");
        
        
    }
    const videoIndex = playList.videos.indexOf(videoId);
    if (videoIndex === -1) {
        throw new ApiError(400, "Video not found in the playlist");
    }

    // Step 4: Remove the video from the playlist's videos array
    playList.videos.splice(videoIndex, 1);

    playList.videos.save()

    return res.status(200).json(
        new ApiResponse(
            200,
            playList,
            "Deleting a video successfully"
        )
    )

})

const deletePlaylist = asynchandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!playlistId) {

        throw new ApiError(200,"playlist of this id not found")
        
    }
    await Playlist.findByIdAndDelete(playlistId)

    return res.status(200).json(
        new ApiResponse(
            200,
            "playlist successfully deleted"
        )
    )
})

const updatePlaylist = asynchandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if (!playlistId) {

        throw new ApiError(400,"Playlist not found")
        
    }

    if (!(name,description)) {

        throw new ApiError(400,"name and description required")
        
    }

    const playList=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name,
                description
            }
        },
        {
            new:true
        }
    )
    return res.status(200).json(
        new ApiResponse(
            200,
            playList,
            "playlist updateed successfully"
        )
    )
    
})








export {
    getUserPlaylists,
    createPlaylist,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}