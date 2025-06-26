import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  if (!content)
    return res.status(400).json(new ApiError(400, "Content is missing"));
  try {
    const newTweet = await Tweet.create({
      content,
      owner: req.user._id,
    });
    if (newTweet) {
      return res
        .status(200)
        .json(new ApiResponse(200, newTweet, "successfully created tweet"));
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

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  try {
    const allTweet = Tweet.find({ owner: req.user._id });
    if (allTweet) {
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
  if (!content || !tweetId)
    return res
      .status(400)
      .json(new ApiError(400, "content, tweetId both required"));

  try {
    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, {
      content,
    });
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
    return res.status(400).json(new ApiError(400, " tweetId is required"));

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
