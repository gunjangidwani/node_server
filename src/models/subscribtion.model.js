import mongoose from 'mongoose';

const { Schema, model } = mongoose;


const subscriptionModel = new Schema({
  subscriber: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  channel: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

export const Subscription = model("Subscription", subscriptionModel);