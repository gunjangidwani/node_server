import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller";

const router = Router();
router.use(verifyJWT);

router.route("/").post(createTweet);
router.route("/:userId").get(getUserTweets);
router.route("/tweetId").delete(deleteTweet).patch(updateTweet);
export default router;