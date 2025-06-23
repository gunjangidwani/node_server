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

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const uploadedFile = await cloudinary.uploader.upload(localFilePath, {
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

const deleteFromCloudinary = async (public_id) => {
  try {
    if (!public_id) return null;
    const response = cloudinary.uploader.destroy(public_id);
    console.log("File has been deleted successfully", response);
  } catch (error) {
    console.log(error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
