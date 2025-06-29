import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
//Bring to constant
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const DEFAULT_SORT_BY = "createdAt";
const DEFAULT_SORT_TYPE = 1;
const MAX_QUERY_LENGTH = 100;

const getAllVideos = asyncHandler(async (req, res) => {
  let {
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    query = "",
    sortBy = DEFAULT_SORT_BY,
    sortType = DEFAULT_SORT_TYPE,
    userId = "",
  } = req.query;

  // Parse and validate query params
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  sortType = parseInt(sortType, 10);
  query = String(query).slice(0, MAX_QUERY_LENGTH);
  //TODO: get all videos based on query, sort, pagination
  // 1. Get the page, limit, query, sortBy, sortType, userId from the request query(frontend) [http://localhost:8000/api/v1/video/all-video?page=1&limit=10&query=hello&sortBy=createdAt&sortType=1&userId=123]
  // 2. Get all videos based on query, sort, pagination)
  // 2.1 match the videos based on title and description
  // 2.2 match the videos based on userId=Owner
  // 3. lookup the Owner field of video and get the user details
  // 4. addFields just add the Owner field to the video document
  // 5. set options for pagination
  // 6. get the videos based on pipeline and options
  const andConditions = [
    {
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    },
  ];
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    andConditions.push({ Owner: userId });
  }
  const pipeline = [
    {
      $match: {
        $and: andConditions,
      },
    },
    // 3. lookup the Owner field of video and get the user details
    {
      // from user it match the _id of user with Owner field of video and saved as Owner
      $lookup: {
        from: "users",
        localField: "Owner",
        foreignField: "_id",
        as: "Owner",
        pipeline: [
          {
            // project the fields of user in Owner
            $project: {
              _id: 1,
              fullName: 1,
              avatar: "$avatar.url",
              username: 1,
            },
          },
        ],
      },
    },
    {
      // 4. addFields just add the Owner field to the video document
      $addFields: {
        Owner: { $first: "$Owner" }, // $first: is used to get the first element of Owner array
      },
    },
    {
      $sort: { [sortBy]: sortType }, // sort the videos based on sortBy and sortType
    },
  ];
  try {
    // 5. set options for pagination
    const options = {
      page,
      limit,
      customLabels: {
        // custom labels for pagination
        totalDocs: "totalVideos",
        docs: "videos",
      },
    };
    // 6. get the videos based on pipeline and options
    const result = await Video.aggregatePaginate(
      Video.aggregate(pipeline),
      options
    );

    if (!result?.videos?.length) {
      return res.status(404).json(new ApiResponse(404, {}, "No Videos Found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Videos fetched successfully"));
  } catch (error) {
    console.error(error.message);
    return res
      .status(500)
      .json(
        new ApiError(500, {}, "Internal server error in video aggregation")
      );
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  // TODO: get video, upload to cloudinary, create video
  // 1. Get the video file and thumbnail from the request body(frontend)
  // 2. upload video and thumbnail to loacl storage and get the path
  // 3. upload video and thumbnail to cloudinary
  // 4. create a video document in the database
  try {
    // 1. Validate required fields
    const { title, description } = req.body;
    if (!title || !description || !title.trim() || !description.trim()) {
      return res
        .status(400)
        .json(new ApiError(400, "Please provide all details"));
    }

    // 2. Validate uploaded files
    const videoFile = req.files?.videoFile?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!videoFile || !videoFile.path) {
      return res.status(400).json(new ApiError(400, "Please upload video"));
    }
    if (!thumbnailFile || !thumbnailFile.path) {
      return res.status(400).json(new ApiError(400, "Please upload thumbnail"));
    }

    // 3. Upload to Cloudinary
    const [videoOnCloudinary, thumbnailOnCloudinary] = await Promise.all([
      uploadOnCloudinary(videoFile.path, "video"),
      uploadOnCloudinary(thumbnailFile.path, "img"),
    ]);

    if (!videoOnCloudinary) {
      return res.status(500).json(new ApiError(500, "Video uploading failed"));
    }
    if (!thumbnailOnCloudinary) {
      return res
        .status(500)
        .json(new ApiError(500, "Thumbnail uploading failed"));
    }

    // 4. Create video document
    const video = await Video.create({
      title,
      description,
      thumbnail: thumbnailOnCloudinary.url,
      videoFile: videoOnCloudinary.url,
      duration: videoOnCloudinary.duration,
      isPublished: true,
      Owner: req.user?._id,
    });

    if (!video) {
      return res.status(500).json(new ApiError(500, "Video creation failed"));
    }

    return res
      .status(201)
      .json(new ApiResponse(201, video, "Video uploaded successfully"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiError(500, {}, "Problem in uploading video"));
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  // 1. Get the video id from the request params(frontend)  [http://localhost:8000/api/v1/video/get-video/:videoId]
  // 2. Check if the videoId id is valid
  // 3. Find the video in the database
  if (!isValidObjectId(videoId)) {
    // Bad request for invalid ID
    throw new ApiError(400, "Invalid VideoID");
  }

  // Use .lean() if you don't need Mongoose document methods
  const video = await Video.findById(videoId);

  if (!video) {
    // Not found
    throw new ApiError(404, "Video not found");
  }

  return res.status(200).json(new ApiResponse(200, video, "Video found"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
      throw new Apierror(400, "Invalid VideoID");
    }

    // Allow partial updates
    const { title, description } = req.body;

    // Validate only if fields are provided
    if (title !== undefined && typeof title !== "string") {
      throw new ApiError(400, "Title must be a string");
    }
    if (description !== undefined && typeof description !== "string") {
      throw new ApiError(400, "Description must be a string");
    }

    // Fetch video
    const video = await Video.findById(videoId).session(session);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    // Ownership check
    if (!video.Owner.equals(req.user._id)) {
      throw new ApiError(
        403,
        "You can't update this video, only owners allowed to update"
      );
    }

    // If thumbnail is provided, process it
    let newThumbnailUrl;
    if (req.file?.path) {
      const thumbnailOnCloudinary = await uploadOnCloudinary(
        req.file.path,
        "img"
      );
      if (!thumbnailOnCloudinary) {
        throw new ApiError(500, "Thumbnail not uploaded on cloudinary");
      }

      // Delete old thumbnail
      const deleted = await deleteFromCloudinary(video.thumbnail, "img");
      if (!deleted) {
        throw new ApiError(500, "Old thumbnail not deleted");
      }
      newThumbnailUrl = thumbnailOnCloudinary.url;
    }

    // Update fields if provided
    if (title !== undefined) video.title = title.trim();
    if (description !== undefined) video.description = description.trim();
    if (newThumbnailUrl) video.thumbnail = newThumbnailUrl;

    await video.save({ session });
    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(new ApiResponse(200, video, "Video details updated successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error.stack);
    return res.status(500).json(new ApiError(500, "Video not updated"));
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid VideoID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    if (!video.Owner.equals(req.user._id)) {
      throw new ApiError(403, "You are not authorized to delete this video");
    }

    // Delete video file from cloudinary
    const videoFileDeleted = await deleteFromCloudinary(
      video.videoFile,
      "video"
    );
    if (!videoFileDeleted) {
      throw new ApiError(500, "Failed to delete video file from Cloudinary");
    }

    // Delete thumbnail from cloudinary
    const thumbnailDeleted = await deleteFromCloudinary(video.thumbnail, "img");
    if (!thumbnailDeleted) {
      throw new ApiError(500, "Failed to delete thumbnail from Cloudinary");
    }

    // Remove video from database
    await video.deleteOne();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video deleted successfully"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json(
        new ApiError(
          error.statusCode || 500,
          {},
          error.message || "Internal Server Error"
        )
      );
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid VideoID");
  }

  // Try to find and update the video in one atomic operation
  const video = await Video.findOneAndUpdate(
    { _id: videoId, Owner: req.user._id },
    [
      { $set: { isPublished: { $not: "$isPublished" } } }, // MongoDB 4.2+ supports $not/$set in update pipeline
    ],
    { new: true }
  );

  if (!video) {
    // If not found, return 404 or 403 depending on your business logic
    return res
      .status(404)
      .json(new ApiError(404, {}, "Video not found or not authorized"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video.isPublished,
        "isPublished toggled successfully"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
