const Order = require("../models/Order.js");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();

//Yeni bir
router.post("/newOrder", upload.none(), async (req, res) => {
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
router.get("/getlAllOrders", async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json({ status: "success", orders });
  } catch (error) {
    res.status(500).json({ status: "error", message: error });
  }
});

// Belli bir cariyi id'ye göre getiren endpoint
router.post("/orderDetail", upload.none(), async (req, res) => {
  try {
    const { _id } = req.body;
    const order = await Order.findById(_id);
    res.status(200).json({ status: "success", order });
  } catch (error) {
    res.status(500).json({ status: "error", message: error });
  }
});

//Cari güncelleyen enpoint
router.post("/updateOrder", upload.none(), async (req, res) => {
  const updateData = req.body;
  try {
    const updateOrder = await Order.findByIdAndUpdate(
      updateData._id,
      updateData,
      { new: true }
    );
    res.status(200).json({
      status: "success",
      message: "Cari başarıyla güncellendi.",
      updateOrder,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error });
  }
});

router.post("/deleteOrder", upload.none(), async (req, res) => {
  try {
    const { _id } = req.body;
    const order = await Order.findByIdAndDelete(_id);
    res.status(200).json({ status: "success", message: "Cari silindi." });
  } catch (error) {
    res.status(500).json({ status: "error", message: error });
  }
});

router.get("/getTedarikciOrders", async (req, res) => {
  try {
    const orders = await Order.find({ ozellik: "Tedarikçi" });
    res
      .status(200)
      .json({
        status: "success",
        message: "Tedarikçiler Başarıyla getirildi.",
        orders,
      });
  } catch (error) {
    res.status(500).json({ status: "error", message: error });
  }
});

router.get("/getMusteriOrders", async (req, res) => {
  try {
    const orders = await Order.find({ ozellik: "Müşteri" });
    res
      .status(200)
      .json({
        status: "success",
        message: "Müşteriler Başarıyla getirildi.",
        orders,
      });
  } catch (error) {
    res.status(500).json({ status: "error", message: error });
  }
});

module.exports = router;
