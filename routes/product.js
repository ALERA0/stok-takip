const Product = require("../models/Product.js");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();

// yeni ürün ekle
router.post("/addProduct", upload.none(), async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const products = await newProduct.save();
    res
      .status(201)
      .json({ status: "succes", message: "Ürün oluşturuldu", products });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

//Bütün ürünleri getir
router.get("/getAllProducts", async (req, res) => {
  try {
    const products = await Product.find();
    res
      .status(200)
      .json({
        status: "success",
        message: "Ürünler başarıyla getirildi",
        products,
      });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

//Ürün güncelleme
router.post("/productUpdate", upload.none(), async (req, res) => {
  const updateData = req.body;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      updateData._id,
      updateData,
      { new: true }
    );
    res
      .status(200)
      .json({ status: "success", message: "Ürün güncellendi", updatedProduct });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

//Ürün detaylarını getiren endpoint
router.post("/productDetail", upload.none(), async (req, res) => {
  try {
    const { _id } = req.body;
    const product = await Product.findById(_id);
    res
      .status(200)
      .json({
        status: "success",
        message: "Ürön detayı başarıyla getirildi",
        product,
      });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

//Ürün silen endpoint
router.post("/productDelete", upload.none(), async (req, res) => {
  try {
    const { _id } = req.body;
    const product = await Product.findByIdAndDelete(_id);
    res.status(200).json({status: "success", message: "Ürün silindi"})
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  
  }
});

module.exports = router;
