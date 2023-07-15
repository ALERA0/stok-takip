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
const orderRouter = require("./routes/order.js");
const productRouter = require("./routes/product.js");

app.use(logger("dev"));
app.use(express.json());
app.use(cors());

app.use("/api", userRouter, orderRouter, productRouter);

app.listen(port, () => {
  connect();
  console.log(`Server is running on port ${port}`);
});
