import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const { Schema, model } = mongoose;

const videoSchema = new Schema(
  {
    videoFile: {
      type: String,
      required: [true, "Video File is required"],
    },
    thumbnail: {
      type: String,
      required: [true, "Video File Thumbnail is required"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Video File Owner is required"],
    },
    title: {
      type: String,
      required: [true, "Video File Title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, "Video File duration is required"],
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.plugin(mongooseAggregatePaginate);


export const Video = model("Video", videoSchema);
