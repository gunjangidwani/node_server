import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config({
  path: "./.env",
});
const app = express();

app.get("/", (req, res) => {
  res.send("<h1>home Api called</h1>");
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log("server started at", process.env.PORT);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed !!!", error);
  });
