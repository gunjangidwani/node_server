import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscribtion.model.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  // checked if user _id has subscribed with the channel id
  // if true - then delete the document else
  // then create a new document with subscription

  if (!channelId)
    return res.status(400).json(new ApiError(400, "Channel ID is required"));

  try {
    const ifChannelExist = await Subscription.findByIdAndDelete(req.user._id);

    if (!ifChannelExist) {
      await Subscription.create({
        subscriber: req.user._id,
        channel: channelId,
      });
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "subscription created"));
    } else {
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "subscription deleted"));
    }
  } catch (error) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          error.message || "something went wrong with toggle subscription"
        )
      );
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // fetch channelId user

  if (!channelId)
    return res.status(400).json(new ApiError(400, "Channel ID is required"));

  try {
    const channelSubs = await Subscription.aggregate([
      {
        $match: { channel: channelId },
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "userProfile",
        },
      },
      {
        $project: {
          fullName: 1,
          avatar: 1,
          username: 1,
        },
      },
    ]);
    // if (!channelSubs.length)
    return res
      .status(200)
      .json(
        new ApiResponse(
          400,
          channelSubs,
          "Successfully fetched subscriber list of a channel"
        )
      );
  } catch (error) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          error.message || "Something went wrong in getting channel subscribers"
        )
      );
  }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!subscriberId)
    return res.status(400).json(new ApiError(400, "subscriber ID is required"));

  try {
    const channelSubs = await Subscription.aggregate([
      {
        $match: { subscriber: subscriberId },
      },
      {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "userProfile",
        },
      },
      {
        $project: {
          fullName: 1,
          avatar: 1,
          username: 1,
        },
      },
    ]);
    // if (!channelSubs.length)
    return res
      .status(200)
      .json(
        new ApiResponse(
          400,
          channelSubs,
          "Successfully fetched channel list of a Subscriber"
        )
      );
  } catch (error) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          error.message || "Something went wrong in getting channel subscribers"
        )
      );
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
