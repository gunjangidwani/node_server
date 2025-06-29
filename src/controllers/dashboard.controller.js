import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // Get channel from req.body, req.params, or req.query
  const channelUsername =
    req.body.channel || req.params.channel || req.query.channel;
  if (!channelUsername) throw new ApiError(400, "Channel identifier required!");

  // Find the channel user document
  const channel = await User.findOne({ username: channelUsername });
  if (!channel) throw new ApiError(400, "Channel not found!");

  const channelID = channel._id;

  // Run all aggregations in a single query using $facet
  const [stats] = await Video.aggregate([
    { $match: { Owner: channelID, isPublished: true } },
    {
      $facet: {
        totalVideosAndViews: [
          {
            $group: {
              _id: null,
              totalViews: { $sum: "$views" },
              totalVideos: { $sum: 1 },
            },
          },
        ],
        totalSubscribers: [
          {
            $match: { Owner: channelID },
          },
          { $count: "totalSubscribers" },
        ],
        // Add more facets here for tweets, comments, likes, etc.
      },
    },
  ]);

  // Get results or default to 0
  const totalViews = stats.totalVideosAndViews[0]?.totalViews || 0;
  const totalVideos = stats.totalVideosAndViews[0]?.totalVideos || 0;
  const totalSubscribers = stats.totalSubscribers[0]?.totalSubscribers || 0;

  // For other stats still requiring separate collections:
  // Tweets
  const tweetCount = await Tweet.countDocuments({ owner: channelID });
  const commentCount = await Comment.countDocuments({ owner: channelID });

  // Likes
  const videoLikes = await Like.countDocuments({
    likedBy: channelID,
    video: { $exists: true },
  });
  const commentLikes = await Like.countDocuments({
    likedBy: channelID,
    comment: { $exists: true },
  });
  const tweetLikes = await Like.countDocuments({
    likedBy: channelID,
    tweet: { $exists: true },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalViews,
        totalVideos,
        totalSubscribers,
        totalTweets: tweetCount,
        totalComments: commentCount,
        totalVideoLikes: videoLikes,
        totalCommentLikes: commentLikes,
        totalTweetLikes: tweetLikes,
      },
      "Stats of the channel"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const { channelID } = req.params;
  let { page = 1, limit = 10 } = req.query;
  // Validate ObjectId
  if (!isValidObjectId(channelID)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  // Validate pagination
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1 || limit > 100) limit = 10; // Set sensible max limit

  // Build aggregation pipeline
  const pipeline = [
    {
      $match: {
        Owner: new mongoose.Types.ObjectId(channelID),
        isPublished: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "Owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    { $unwind: "$ownerDetails" },
    {
      $addFields: {
        username: "$ownerDetails.username",
        fullName: "$ownerDetails.fullName",
        avatar: "$ownerDetails.avatar",
      },
    },
    { $project: { ownerDetails: 0 } },
  ];

  const options = {
    page,
    limit,
    customLabels: {
      totalDocs: "total_videos",
      docs: "Videos",
    },
  };

  try {
    const videos = await Video.aggregatePaginate(pipeline, options);

    if (!videos || videos.total_videos === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Videos Not Found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { videos }, "Videos Found"));
  } catch (err) {
    // Log error and return generic error response
    console.error(err);
    throw new ApiError(500, "Internal Server Error");
  }
});

export { getChannelStats, getChannelVideos };
