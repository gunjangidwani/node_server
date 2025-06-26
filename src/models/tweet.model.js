import { Schema, model } from "mongoose";

const tweetSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Tweet Owner is requited!"],
    },
    content: {
      type: String,
      required: [true, "Tweet Content is requited!"],
    },
  },
  {
    timestamps: true,
  }
);

export const Tweet = model("Tweet", tweetSchema);
