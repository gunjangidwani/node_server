import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

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
      avatar: uploadAvatarOnCloudinary?.url,
      coverImage: uploadCoverImageOnCloudinary?.url || "",
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
    return res.status(400).json({
      message: error.message,
    });
  }
});

export { registerUser };
