import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asynchandler} from "../utils/Asynchandler.js"
import { response } from "express"


const toggleSubscription = asynchandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    const userId=req.user._id

    if (!(mongoose.Types.ObjectId.isValid(channelId)&&userId)) {

        throw new ApiError(400,"channelid and userid are in valid");
        
        
    }
    const existeduser=await Subscription.findone({channel:channelId,user:userId})

    if (existeduser) {
        await existeduser.remove()
        return res.status(200).json(
            new ApiResponse(
                200,
                "user unsubscribed successfully"
            )
        )
        
    }else{
        const newSubscription= new Subscription({
            channel:channelId,
            user:userId,
            subscribedAt:Date.now()
        })

        await newSubscription.save()

        return res.status(200).json(
            new ApiResponse(
                200,
                "Subscribed successfully"
            )
        )
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asynchandler(async (req, res) => {
    const {channelId} = req.params

    if(!channelId){
        throw new ApiError(400,"invalid channelId");
        
    }
    const subscriber=await Subscription.aggregate([
        {
            $match:{
                channel:channelId
            }
        },
        {
            $lookup:{
                from:"users",
                localfield:'subscriber',
                foreignfield:"_id",
                as:'subscriberdetails'

            }
        },
        {
            $unwind:"$subscriberdetails"
            
        },
       
        {
            $project:{
                _id:0,
                userId:'$subscriberdetails._id',
                name:'$subscriberdetails.name',
                email:'$subscriberdetails.email',
                subscribedAt:'$subscribeAt'
            }
        }


    ])
    if(!subscriber||subscriber.length===0){
        return res.status(200).json(
            new ApiResponse(
                200,
                subscriber,
                "no subscriber found for this channel"
            )
        )
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            subscriber,
            "subscriber list successfully fatched"
        )
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asynchandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!subscriberId){
        throw new ApiError(400,"subscriber not reached")
    }
    const subscribedChannel=await Subscription.aggregate([
        {
            $match:{
                subscriber:subscriberId
            }

        },
        {
            $lookup:{
                from:'users',
                localfield:'channel',
                foreignfield:'_id',
                as:'channelDetails'
            }
        },
        {
            $unwind:'$channelDetails'
        },
        {
            $project:{
                _id: 0, // Exclude the subscription ID
                channelId: '$channelDetails._id',
                channelName: '$channelDetails.name',
                subscribedAt: '$createdAt',
            }

        }
    ])

    if(!subscribedChannel||subscribedChannel.length===0){
        return res.status(200).json(
            new ApiResponse(
                200,
                subscribedChannel,
                "no subscribed channel fetched"
            )
        )
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            subscribedChannel,
            "subscribed channel fetched"
        )
    )

    

})





export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}