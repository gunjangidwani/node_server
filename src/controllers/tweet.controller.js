import { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  // 1. get content from req.body
  // 2. post tweet to db

  const { content } = req.body;
  if (!content)
    return res.status(400).json(new ApiError(400, "Content is missing"));
  try {
    const newTweet = await Tweet.create({
      content,
      owner: req.user?._id,
    });
    if (!newTweet) {
      throw new ApiError(500, "Tweet not posted!"); // Use throw for consistency
    }

    return res
      .status(201)
      .json(new ApiResponse(201, newTweet, "successfully created tweet"));
  } catch (error) {
    res
      .status(400)
      .json(
        new ApiError(
          400,
          error.message || "Something went wrong with crearting tweet!!"
        )
      );
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  // 1. get userId from params URL
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res
        .status(400)
        .json(new ApiError(400, "UserId is not valid objectId"));
    }
    // 2. find all the tweets of the user
    const allTweet = await Tweet.find({ owner: userId });
    if (allTweet) {
      // 3. return the list of tweets
      return res
        .status(200)
        .json(
          new ApiResponse(200, allTweet, "successfully fetched user tweets")
        );
    }
  } catch (error) {
    res
      .status(400)
      .json(
        new ApiError(
          400,
          error.message || "Something went wrong with crearting tweet!!"
        )
      );
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { content, tweetId } = req.body;
  if (!content || !isValidObjectId(tweetId))
    return res
      .status(400)
      .json(new ApiError(400, "content, tweetId both are required"));

  try {
    const updatedTweet = await Tweet.findOneAndUpdate(
      { owner: req.user._id, _id: tweetId },
      {
        content,
      },
      { new: true }
    );
    if (updatedTweet) {
      return res
        .status(200)
        .json(
          new ApiResponse(200, updatedTweet, "successfully updated user tweet")
        );
    }
  } catch (error) {
    res
      .status(400)
      .json(
        new ApiError(
          400,
          error.message || "Something went wrong with updating tweet!!"
        )
      );
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.body;
  if (!tweetId)
    return res.status(400).json(new ApiError(400, "tweetId is required"));

  try {
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
    if (deletedTweet) {
      return res
        .status(200)
        .json(
          new ApiResponse(200, deletedTweet, "successfully deleted user tweet")
        );
    }
  } catch (error) {
    res
      .status(400)
      .json(
        new ApiError(
          400,
          error.message || "Something went wrong with deleting tweet!!"
        )
      );
  }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
