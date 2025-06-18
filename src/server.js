import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log("server started at", process.env.PORT);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed !!!", error);
  });
