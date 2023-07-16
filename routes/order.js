const Order = require("../models/Order.js");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();

router.post("/newproduct", upload.none(), async (req, res) => {
  try {
    const order = new Order(req.body);
    const savedOrder = await order.save();
    res
      .status(201)
      .json({ status: "succes", message: "Cari oluşturuldu", savedOrder });
  } catch (error) {
    res.status(500).json({ status: "error", message: error });
  }
});

//Bütün carileri getiren endpoint
router.get("/get-all-orders", async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json({ status: "success", orders });
  } catch (error) {
    res.status(500).json({ status: "error", message: error });
  }
});

// Belli bir cariyi id'ye göre getiren endpoint
router.post("/get-order", upload.none(),async (req, res) => {
  try {
    const { _id } = req.body;
    const order = await Order.findById(_id);
    res.status(200).json({ status: "success", order });
  } catch (error) {
    res.status(500).json({ status: "error", message: error });
  }
});



module.exports = router;
