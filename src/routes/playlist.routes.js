import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller";
const router = Router();
router.use(verifyJWT);

router.route("/").post(createPlaylist);
router.route("/:userId").get(getUserPlaylists);
router
  .route("/:playlistId")
  .get(getPlaylistById)
  .delete(deletePlaylist)
  .patch(updatePlaylist);
router
  .route("/:playlistId/:videoId")
  .post(addVideoToPlaylist)
  .delete(removeVideoFromPlaylist);
export default router;