import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { COOKIE_OPTIONS } from "../constants.js";
import { Types } from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "something went wrong while generating user token");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  try {
    const { email, fullName, username, password } = req.body;
    if (
      [email, fullName, username, password].some(
        (field) => field?.trim() === ""
      )
    ) {
      throw new ApiError(
        400,
        "email, fullName, username, password are required feilds"
      );
    }
    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existedUser) {
      throw new ApiError(409, "User with email and username already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage
      ? req.files?.coverImage[0]?.path
      : undefined;
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar File is required");
    }
    const uploadAvatarOnCloudinary = await uploadOnCloudinary(avatarLocalPath);
    const uploadCoverImageOnCloudinary = coverImageLocalPath
      ? await uploadOnCloudinary(coverImageLocalPath)
      : null;

    if (!uploadAvatarOnCloudinary) {
      throw new ApiError(
        400,
        "Avatar File is required, Failed to upload avatar File"
      );
    }

    const user = await User.create({
      fullName,
      email,
      password,
      username: username.toLowerCase(),
      avatar: {
        imagePublicId: uploadAvatarOnCloudinary?.public_id,
        imageUrl: uploadAvatarOnCloudinary?.url,
      },
      coverImage: {
        imagePublicId: uploadCoverImageOnCloudinary?.public_id || "",
        imageUrl: uploadCoverImageOnCloudinary?.url || "",
      },
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );
    }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
  } catch (error) {
    console.log("User Registeration failed");
    throw new ApiError(400, error.message);
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!(username || email)) {
      throw new ApiError(400, "username or email is required");
    }
    const ifUserExist = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (!ifUserExist) {
      throw new ApiError(400, "User does not exist");
    }

    const isPasswordValid = await ifUserExist.isPasswordCorrect(password);
    if (isPasswordValid) {
      throw new ApiError(400, "Password does not match");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      ifUserExist._id
    );

    const loggedInUser = await User.findById(ifUserExist._id).select(
      " -password -refreshToken"
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, COOKIE_OPTIONS)
      .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
      .json(
        new ApiResponse(
          200,
          { user: loggedInUser, accessToken, refreshToken },
          "Login successfull"
        )
      );
  } catch (error) {
    console.log("User Login failed");
    throw new ApiError(400, error.message);
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", COOKIE_OPTIONS)
    .clearCookie("refreshToken", COOKIE_OPTIONS)
    .json(new ApiResponse(200, {}, "User Logout Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // chekc if user has access token - if not throw err
  // decode the the token from user and verify
  // compare users doc sccess token with provided token - if not same throw error
  // if no error then generate new access and refesh token and send res in cookie

  const providedRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!providedRefreshToken)
    throw new ApiError(400, "Unauthorized Request, token does not match");

  try {
    const decodedInformation = jwt.verify(
      providedRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedInformation._id);
    if (!user)
      throw new ApiError(400, "Unathourized token, User can't be found");

    if (providedRefreshToken !== user.refreshToken)
      throw new ApiError(400, "Refresh Token is expired or used");

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      decodedInformation._id
    );

    return res
      .status(200)
      .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
      .cookie("accessToken", accessToken, COOKIE_OPTIONS)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "User Token Refreshed Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(400, error.message || "Something went wrong!!!");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword, email } = req.body;

    if (!oldPassword || !newPassword)
      throw new ApiError(
        400,
        "old password and new password both are required!"
      );

    const user = await User.findById(req.user._id);
    const checkOldPassword = await user.isPasswordCorrect(oldPassword);
    if (checkOldPassword) throw new ApiError(400, "Old password is incorrect");

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "password changed successfully!!"));
  } catch (error) {
    throw new ApiError(
      400,
      error.message || "something went wrong while changing user password"
    );
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    return res
      .status(200)
      .json(
        new ApiResponse(200, { user: req.user }, "User found successsfully")
      );
  } catch (error) {
    throw new ApiError(400, error.message || "User not found");
  }
});

const updateUserDetails = asyncHandler(async (req, res) => {
  try {
    const { fullName, email } = await req.body;
    console.log(fullName, email);
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          fullName,
          email,
        },
      },
      {
        new: true,
      }
    ).select(" -password -refreshToken");
    if (!updatedUser) throw new ApiError(400, "User not found to update");

    return res
      .status(200)
      .json(new ApiResponse(200, { updatedUser }, "User updated Successfully"));
  } catch (error) {
    throw new ApiError(
      400,
      error.message || "something went wrong while udating user details"
    );
  }
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  //check if path is provided by multer,
  // if yes get user info and save old public key in local var
  // first upload the cloudinary image and update the user image id and puclic id
  // after that delete the old image from clodinary
  try {
    const avatarLocalPath = req.file.path;
    if (!avatarLocalPath) throw new ApiError(400, "Avatar file not provided");

    const user = await User.findById(req.user._id);

    if (!user) throw new ApiError(400, "User not found");

    const oldPublicId = user.avatar?.imagePublicId;

    const uploadAvatarOnCloudinary = await uploadOnCloudinary(avatarLocalPath);

    if (!uploadAvatarOnCloudinary) {
      throw new ApiError(
        400,
        "Avatar File is required, Failed to upload avatar File"
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          avatar: {
            imagePublicId: uploadAvatarOnCloudinary?.public_id,
            imageUrl: uploadAvatarOnCloudinary?.url,
          },
        },
      },
      { new: true }
    );

    if (!updatedUser)
      throw new ApiError(
        500,
        "Avatar File could not be uploaded, Failed to upload avatar File"
      );

    const deleteResponse = await deleteFromCloudinary(oldPublicId);
    console.log(deleteResponse);
    return res
      .status(200)
      .json(
        new ApiResponse(200, { updatedUser }, "User avatar updaed succesfully")
      );
  } catch (error) {
    throw new ApiError(
      400,
      error.message || "Something went wrong while updating user avatar file"
    );
  }
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  try {
    const coverImageLocalPath = req.file.path;
    if (!coverImageLocalPath)
      throw new ApiError(400, "Cover Image file not provided");

    const user = await User.findById(req.user._id);

    if (!user) throw new ApiError(400, "User not found");

    const oldPublicId = user.coverImage?.imagePublicId;

    const uploadCoverImageOnCloudinary =
      await uploadOnCloudinary(coverImageLocalPath);

    if (!uploadCoverImageOnCloudinary) {
      throw new ApiError(
        400,
        "Cover Image File is required, Failed to upload Cover Image File"
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          coverImage: {
            imagePublicId: uploadCoverImageOnCloudinary?.public_id,
            imageUrl: uploadCoverImageOnCloudinary?.url,
          },
        },
      },
      { new: true }
    );

    if (!updatedUser)
      throw new ApiError(
        500,
        "CoverImage File could not be uploaded, Failed to upload CoverImage File"
      );

    const deleteResponse = (await oldPublicId)
      ? deleteFromCloudinary(oldPublicId)
      : "";
    console.log(deleteResponse);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { updatedUser },
          "User CoverImage updaed succesfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      400,
      error.message ||
        "Something went wrong while updating user CoverImage file"
    );
  }
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.query;
  console.log(req.query);
  if (!username?.trim()) {
    throw new ApiError(400, "Username is required");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscribers",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  console.log(channel);
  if (!channel?.length) {
    throw new ApiError(400, "Channel doesn't exist");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel fetch successfully"));
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: req.user?._id,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    avatar: 1,
                    username: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
};
