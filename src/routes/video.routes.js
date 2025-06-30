import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";

const router = Router();

router.use(verifyJWT); // user to be authentcated to query videos

router
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      {
        name: videoFile,
        maxCount: 1,
      },
      {
        name: thumbnailFile,
        maxCount: 1,
      },
    ]),
    publishAVideo
  );

router
  .route("/:videoId")
  .get(getVideoById)
  .patch(upload.single("thumbnailFile"), updateVideo)
  .delete(deleteVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);
export default router;