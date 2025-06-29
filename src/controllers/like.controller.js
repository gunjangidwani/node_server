import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function toggleLike({ userId, targetId, targetField }) {
  if (!isValidObjectId(targetId)) {
    throw new ApiError(400, `Invalid ${targetField}`);
  }

  const filter = { likedBy: userId, [targetField]: targetId };
  const existingLike = await Like.findOne(filter);

  if (existingLike) {
    const unlike = await Like.findByIdAndDelete(existingLike._id);
    return { action: "removed", result: unlike };
  } else {
    const like = await Like.create(filter);
    return { action: "added", result: like };
  }
}

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  // 1. get videoId from params URL
  // 2. check if the user has already liked the video
  // 3. if already liked then delete the like
  // 4. if not liked then add the like
  const { action, result } = await toggleLike({
    userId: req.user?._id,
    targetId: videoId,
    targetField: "video",
  });

  return res.status(200).json(new ApiResponse(200, result, `Like ${action}`));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  const { action, result } = await toggleLike({
    userId: req.user?._id,
    targetId: commentId,
    targetField: "comment",
  });

  return res.status(200).json(new ApiResponse(200, result, `Like ${action}`));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  const { action, result } = await toggleLike({
    userId: req.user?._id,
    targetId: tweetId,
    targetField: "tweet",
  });
  return res.status(200).json(new ApiResponse(200, result, `Like ${action}`));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  // Find all liked videos of the logged-in user
  const likedVideos = await Like.find({
    likedBy: req.user?._id,
    video: { $exists: true },
  });

  // If you want to throw a 404 when no videos are found:
  if (!likedVideos || likedVideos.length === 0) {
    throw new ApiError(404, "No liked videos found.");
  }

  // Return the list of liked videos
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalVideos: likedVideos.length,
        videos: likedVideos,
      },
      "Videos found!"
    )
  );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
