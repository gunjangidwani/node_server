const express = require('express');
const dotenv = require('dotenv');
dotenv.config()
const app = express();

app.get("/", (req, res) => {
  res.send("<h1>home Api called</h1>");
});

app.listen(process.env.PORT, () => {
  console.log("server started at", process.env.PORT);
})