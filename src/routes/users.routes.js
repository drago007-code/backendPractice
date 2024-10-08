import { Router } from "express";
import { loggedOut, loginUser, registeruser, changeCurrentPassword, 
    getCurrentUser, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfile, 
    refreshTokenAccess,
    getWatchHistory, 
    updateAccountDetails } from "../controllers/users.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router= Router()

router.route("/register").post(
    upload.fields([
        { 
            name:"avatar",
            maxCount:"1"
        },
        {
            name:"coverImage",
            maxCount:"1"
        }
    ]),
    registeruser
)
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT,loggedOut)
router.route("/refresh-token").post(refreshTokenAccess)

router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)



export default router