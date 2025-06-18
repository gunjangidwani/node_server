import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
// json -to make response in json format, we can provide limit as well
app.use(
  express.json({
    limit: "16kb",
  })
);

// urlencoded - different browsersshow params in different format, to accept all
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);
// to handle files at folder level
app.use(express.static("public"));

app.use(cookieParser());

// routes import

import userRouter from "./routes/user.routes.js";

app.use("/api/v1/users", userRouter);

export { app };
