import {Router} from "express"
import { 
    changeUserPassword,
    getCurrentUser,
    getUserProfileDetail,
    loginUser,
    logoutUser,
    refreshAccessToken, 
    registerUser, 
    updateAccountDetail,
    updateUserAvatar,
    updateUserCoverImage,
    userWatchHistory
    } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.get("/test", (req, res) => {
  console.log("✅ Test route hit!");
  res.send("User router working");
});


router.route("/register").post(
    upload.fields([{
        name:"avatar",
        maxCount: 1
    },
    {
        name:"coverImage",
        maxCount: 1
    }]),
    registerUser);
    router.route("/login").post(loginUser)
    router.route("/logout").post(verifyJWT, logoutUser)
    router.route("refresh-token").post(refreshAccessToken)
    router.route("/change-password").post(verifyJWT, changeUserPassword)
    router.route("/current-user").get(verifyJWT, getCurrentUser)
    router.route("/update-account").patch(verifyJWT, updateAccountDetail)
    router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
    router.route("/coverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
    router.route("/c/:username").get(verifyJWT, getUserProfileDetail)
    router.route("/history").get(verifyJWT, userWatchHistory)
    


export default router;