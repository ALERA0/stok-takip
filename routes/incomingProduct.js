const IncomingProduct = require("../models/IncomingProduct.js");
const express = require("express");
const app = express();
const router = express.Router();
const multer = require("multer");
const Product = require("../models/Product.js");
const upload = multer();
const mongoose = require("mongoose");
app.use(express.json());


//Yeni bir gelen ürün ekleyen endpoint
router.post("/addIncomingProduct", upload.none(), async (req, res) => {
  try {
    const { documentDate, documentNumber, order, description, products } =
      req.body;
    const incomingProducts = [];

    for (const product of products) {
      const { productId, productQuantity } = product;

      const foundProduct = await Product.findById(productId);
      if (!foundProduct) {
        throw new Error("Ürün bulunamadı");
      }

      // Update the product quantity in Product model
      foundProduct.productQuantity += parseInt(productQuantity); // Convert to integer and add to existing quantity
      await foundProduct.save();

      // Add product and quantity to incomingProducts array
      incomingProducts.push({
        product: foundProduct._id,
        productQuantity: parseInt(productQuantity),
      });
    }

    const incomingProduct = new IncomingProduct({
      documentDate,
      documentNumber,
      order,
      description,
      products: incomingProducts,
    });

    await incomingProduct.save();

    res.status(200).json({
      status: "success",
      message: "Ürün girişi başarıyla gerçekleştirildi.",
      incomingProduct,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});



// Ürün girişini güncelle
router.post("/updateIncomingProduct", upload.none(), async (req, res) => {
  try {
    const { _id, documentDate, documentNumber, order, description, products } =
      req.body;

    // Mevcut ürün girişini bulma
    const incomingProduct = await IncomingProduct.findById(_id);
    if (!incomingProduct) {
      throw new Error("Güncellenecek ürün girişi bulunamadı");
    }

    // Veri tiplerini kontrol etmek için forEach ile tüm ürünleri dönüyoruz
    req.body.products.forEach((product) => {
      const parsedQuantity = parseInt(product.productQuantity, 10);
      console.log(parsedQuantity,"ASKLJDASKLKJGDASKGHJDSGHJKSD")
      if (isNaN(parsedQuantity)) {
        throw new Error("productQuantity değeri geçerli bir sayı değil");
      }
      // ...
    });

    const updatedProductIds = new Set();

    for (const product of products) {
      const { productId, productQuantity } = product;
      const foundProduct = await Product.findById(productId);

      console.log("Found Product:", foundProduct);

      if (!foundProduct) {
        throw new Error("Ürün bulunamadı");
      }

      // Güncellenen ürünün quantity farkını hesapla
      const existingProduct = incomingProduct.products.find(
        (item) => item.product && item.product.toString() === productId
      );

      let diffQuantity = 0;
      if (existingProduct) {
        const parsedQuantity = parseInt(productQuantity, 10);
        diffQuantity = parsedQuantity - existingProduct.quantity;
        // IncomingProduct modelindeki quantity değerini güncelle
        existingProduct.quantity = parsedQuantity;
      } else {
        incomingProduct.products.push({
          product: productId,
          quantity: parseInt(productQuantity, 10),
        });
      }

      // Product modelindeki quantity değerini güncelle
      foundProduct.productQuantity += diffQuantity;
      console.log(
        "Product güncellendi -> productId:",
        foundProduct._id,
        "quantity:",
        foundProduct.productQuantity
      );
      await foundProduct.save();

      updatedProductIds.add(productId);
    }

    // Mevcut ürünler içinde güncellenmeyenleri kaldır
    incomingProduct.products = incomingProduct.products.filter((item) =>
      updatedProductIds.has(item.product && item.product.toString())
    );

    console.log(
      "IncomingProduct güncellendi -> incomingProduct.products:",
      incomingProduct.products
    );

    incomingProduct.documentDate = documentDate;
    incomingProduct.documentNumber = documentNumber;
    incomingProduct.order = order;
    incomingProduct.description = description;

    console.log(
      "IncomingProduct güncelleniyor -> documentDate:",
      documentDate,
      "documentNumber:",
      documentNumber,
      "order:",
      order,
      "description:",
      description
    );

    await incomingProduct.save();

    res.status(200).json({
      status: "success",
      message: "Ürün girişi başarıyla güncellendi.",
      incomingProduct,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ... Diğer router tanımlamaları ...




module.exports = router;
