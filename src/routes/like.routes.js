import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller";
const router = Router();
router.use(verifyJWT);

router.route("/video").get(getLikedVideos);
router.route("/toggle/comment/:commentId").post(toggleCommentLike);
router.route("/toggle/tweet/:tweetId").post(toggleTweetLike);
router.route("/toggle/video/:videoId").post(toggleVideoLike);
export default router;