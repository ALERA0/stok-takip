const Product = require("../models/Product.js");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();

router.post("/add-product", upload.none(), async (req, res) => {
  try {
    const product = new Product(req.body);
    const products = await product.save();
    res
      .status(201)
      .json({ status: "succes", message: "Ürün oluşturuldu", products });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
