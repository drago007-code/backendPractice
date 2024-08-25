import { ApiError } from "../utils/ApiError.js";
import { asynchandler } from "../utils/Asynchandler.js"
import { User } from "../models/user.model.js";
import { cloudinary } from "../utils/Cloudnariy.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registeruser = asynchandler(async (req, res) => {
    //get user details
    const { fullname, email, username, password } = req.body
    console.log("email:", email);


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
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(409, "Avatar is required");

    }
    //upload them to cloudinary, avatar
    const avatar = await cloudinary(avatarLocalPath);
    const coverImage = await cloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(500, "Avatar is required")
    }


    //create user object --create entry in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
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



export { registeruser }