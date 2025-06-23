import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!accessToken) {
      throw new ApiError(401, "UnAuthorized Request");
    }
    const decodedInformation = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    const user = await User.findById(decodedInformation?._id).select(
      "-password -refreshToken"
    );

    if (!user)
      throw new ApiError(401, "Invalid Access Token - user can't be found");

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError("401", error?.message || "Invalid Access Token");
  }
});
