import { Schema, model } from "mongoose";

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: [true, "Tweet Owner is requited!"],
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: [true, "Video Owner is requited!"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Comment Owner is requited!"],
    },
  },
  {
    timestamps: true,
  }
);

export const Comment = model("Comment", commentSchema);
