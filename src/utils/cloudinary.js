import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath, path) => {
  try {
    if (!localFilePath) return null;
    const uploadedFile = await cloudinary.uploader.upload(localFilePath, {
      asset_folder: path,
      resource_type: "auto",
    });

    // file has been uploaded successfully
    console.log("File has been uploaded successfully", uploadedFile);
    fs.unlinkSync(localFilePath); // remove the locally saved temp file as the upload operation successfull

    return uploadedFile;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temp file as the upload operation failed
    return null;
  }
};

const deleteFromCloudinary = async (cloudinaryFilePath, path) => {
  try {
    if (!cloudinaryFilePath) return null;

    const avatarPublicId = cloudinaryFilePath.split("/").pop().split(".")[0];

    const response = await cloudinary.uploader.destroy(
      `${path}/${avatarPublicId}`
    );

    return response;
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
