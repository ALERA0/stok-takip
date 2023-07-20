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
    const incomingProduct = new IncomingProduct({
      documentDate,
      documentNumber,
      order,
      description,
      products: [],
    });

    for (const product of products) {
      const { productId, productQuantity } = product;
      const foundProduct = await Product.findById(productId);

      if (!foundProduct) {
        throw new Error("Ürün bulunamadı");
      }

      // Product modelindeki quantity değerini güncelle
      foundProduct.productQuantity += parseInt(productQuantity, 10);
      await foundProduct.save();

      // Add product and quantity to incomingProducts array
      incomingProduct.products.push({
        product: foundProduct._id,
        quantity: parseInt(productQuantity, 10),
      });
    }

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
      if (isNaN(parsedQuantity)) {
        throw new Error("productQuantity değeri geçerli bir sayı değil");
      }
      // ...
    });

    for (const product of products) {
      const { productId, productQuantity } = product;
      const foundProduct = await Product.findById(productId);

      if (!foundProduct) {
        throw new Error("Ürün bulunamadı");
      }

      // Güncellenen ürünün quantity farkını hesapla
      const existingProduct = incomingProduct.products.find(
        (item) => item.product && item.product.toString() === productId
      );

      if (existingProduct) {
        const parsedQuantity = parseInt(productQuantity, 10);
        const diffQuantity = parsedQuantity - existingProduct.quantity;

        // IncomingProduct modelindeki quantity değerini güncelle
        existingProduct.quantity = parsedQuantity;

        // Product modelindeki quantity değerini güncelle
        foundProduct.productQuantity += diffQuantity;
        await foundProduct.save();
      } else {
        // Yeni ürünleri güncellenen ürünler listesine ekle
        incomingProduct.products.push({
          product: productId,
          quantity: parseInt(productQuantity, 10),
        });

        // Product modelindeki quantity değerini güncelle
        foundProduct.productQuantity += parseInt(productQuantity, 10);
        await foundProduct.save();
      }
    }

    incomingProduct.documentDate = documentDate;
    incomingProduct.documentNumber = documentNumber;
    incomingProduct.order = order;
    incomingProduct.description = description;

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



router.post("/removeProduct", upload.none(), async (req, res) => {
  try {
    const { _id, productIdToRemove } = req.body;

    // Mevcut ürün girişini bulma
    const incomingProduct = await IncomingProduct.findById(_id);
    if (!incomingProduct) {
      throw new Error("Güncellenecek ürün girişi bulunamadı");
    }

    // Çıkarılacak ürünü bul ve quantity değerini al
    const productToRemove = incomingProduct.products.find(
      (product) => product.product.toString() === productIdToRemove
    );

    if (!productToRemove) {
      throw new Error("Çıkarılacak ürün listede bulunamadı");
    }

    const { quantity: removedQuantity } = productToRemove;

    // Ürünleri productId değerine göre filtrele ve productIdToRemove değerine sahip olanı çıkart
    incomingProduct.products = incomingProduct.products.filter(
      (product) => product.product.toString() !== productIdToRemove
    );

    // Çıkarılan ürünün quantity değerini Product modelinde azalt
    const foundProduct = await Product.findById(productIdToRemove);
    if (foundProduct) {
      foundProduct.productQuantity -= removedQuantity;
      await foundProduct.save();
    }

    // incomingProduct'i güncelle
    await incomingProduct.save();

    res.status(200).json({
      status: "success",
      message: "Ürün başarıyla çıkartıldı.",
      incomingProduct,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

















module.exports = router;
