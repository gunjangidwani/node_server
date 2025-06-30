import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller";
const router = Router();
router.use(verifyJWT);

router.route("/videoId").post(addComment).get(getVideoComments);

router.route("/:commentId").patch(updateComment).delete(deleteComment);

export default router;
