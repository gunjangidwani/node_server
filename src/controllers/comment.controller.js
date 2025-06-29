import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  let { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = req.query;

  // Validate videoId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Parse and validate pagination parameters
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  if (isNaN(page) || page < 1) page = DEFAULT_PAGE;
  if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;

  const pipeline = [{ $match: { video: ObjectId(videoId) } }];

  const options = {
    page,
    limit,
    customLabels: {
      totalDocs: "totalComments",
      docs: "comments",
    },
  };

  const commentsResult = await Comment.aggregatePaginate(pipeline, options);

  if (!commentsResult || commentsResult.totalComments === 0) {
    throw new ApiError(404, "No comments found for this video");
  }

  return res.status(200).json(
    new ApiResponse(200, {
      comments: commentsResult.comments,
      totalComments: commentsResult.totalComments,
      size: commentsResult.comments.length,
    })
  );
});

const addComment = asyncHandler(async (req, res) => {
  // 1. Get videoId from params and content from body
  const { videoId } = req.params;
  const { content } = req.body;

  // Validate videoId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, {}, "Invalid video ID");
  }

  // Validate comment content
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    throw new ApiError(400, {}, "Please enter a valid comment");
  }

  // Create new comment
  const comment = await Comment.create({
    content: content.trim(),
    video: new mongoose.Types.ObjectId(videoId),
    owner: req.user?._id, // Assuming req.user._id is an ObjectId already
  });

  if (!comment) {
    throw new ApiError(500, {}, "Comment not saved to DB");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  // Validate commentId
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, {}, "Invalid commentId");
  }

  // Validate content existence and type
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new ApiError(400, {}, "Content must be a non-empty string");
  }

  // Find the comment by id and owner
  const comment = await Comment.findOne({
    _id: commentId,
    owner: req.user._id,
  });

  if (!comment) {
    throw new ApiError(
      404,
      {},
      "Comment not found or you are not authorized to update this comment"
    );
  }

  // Update content and save
  comment.content = content.trim();
  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  // Combine _id and owner directly (no need for $and)
  const delResult = await Comment.deleteOne({
    _id: commentId,
    owner: req.user._id,
  });

  // Check if any document was deleted
  if (delResult.deletedCount === 0) {
    // 403 Forbidden is a better status for unauthorized deletion
    return res
      .status(403)
      .json(
        new ApiError(
          403,
          "You are not authorized to delete this comment or comment does not exist"
        )
      );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
