import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    throw new ApiError(400, "Please provide both name and description");
  }

  const createdPlaylist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, createdPlaylist, "Playlist created successfully!")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId!");
  }

  const playlists = await Playlist.find({ owner: userId });

  // It's common to return an empty array (200 OK) if no playlists found
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlists,
        playlists.length ? "Playlists found" : "No playlists found"
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res.status(200).json(new ApiResponse(200, playlist, "Playlist found"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlistId or videoId");
  }

  // Use $addToSet to ensure uniqueness and atomicity
  const updatedPlaylist = await Playlist.findOneAndUpdate(
    { _id: playlistId, owner: req.user?._id },
    { $addToSet: { videos: videoId } }, // Adjust field name per your schema
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(
      404,
      "Playlist not found or you do not have permission to update this playlist!"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Video added in the playlist!")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // 1. Get playlistId and videoId from params URL
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlistId or videoId");
  }

  // 2. Find the playlist by playlistId
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found!");
  }

  // 3. Check if the playlist owner is the same as the logged-in user
  if (!playlist.owner.equals(req.user?._id)) {
    throw new ApiError(403, "You can't update this playlist!");
  }

  // 4. Check if the video exists in the playlist
  if (!playlist.video.includes(videoId)) {
    throw new ApiError(404, "Video not found in playlist!");
  }

  // 5. Remove the video from the playlist and save
  playlist.video.pull(videoId);
  const videoRemoved = await playlist.save();

  if (!videoRemoved) {
    throw new ApiError(500, "Please try again!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videoRemoved, "Video removed successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  // 1. get playlistId from params URL
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  // 2. find the playlist by id
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found!");
  }

  // 3. check if the playlist owner is the same as the logged-in user
  if (!playlist.owner.equals(req.user?._id)) {
    throw new ApiError(403, "You can't delete this playlist!");
  }

  // 4. delete the playlist
  await Playlist.findByIdAndDelete(playlistId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Playlist deleted successfully!"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  // 1. get playlistId from params URL
  // 2. get name and description from req.body
  // 3. find the playlist by id
  // 4. check if the playlist owner is the same as the logged-in user
  // 5. update the playlist
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }
  if (!name && !description) {
    throw new ApiError(400, "Please provide name or description");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found!");
  }

  if (!playlist.owner.equals(req.user?._id)) {
    throw new ApiError(403, "You can't update this playlist!");
  }

  if (name !== undefined) playlist.name = name;
  if (description !== undefined) playlist.description = description;

  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully!"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
