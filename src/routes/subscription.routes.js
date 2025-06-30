import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller";
const router = Router();
router.use(verifyJWT);

router
  .route("/:channelId")
  .post(toggleSubscription)
  .get(getUserChannelSubscribers);

router.route(":/subscriberId").get(getSubscribedChannels);
export default router;