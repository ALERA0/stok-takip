const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
dotenv.config();
const logger = require("morgan");

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log(error);
  }
};

const userRouter = require("./routes/user.js");

app.use(logger("dev"));
app.use(express.json());
app.use(cors());

app.use("/api", userRouter);

app.listen(port, () => {
  connect();
  console.log(`Server is running on port ${port}`);
});
