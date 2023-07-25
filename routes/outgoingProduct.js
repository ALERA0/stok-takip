const OutgoingProduct = require("../models/OutgoingProduct.js");
const IncomingProduct = require("../models/IncomingProduct.js");
const express = require("express");
const app = express();
const router = express.Router();
const multer = require("multer");
const Product = require("../models/Product.js");
const upload = multer();
const mongoose = require("mongoose");
app.use(express.json());

// ... Diğer endpointleriniz ...

// Çıkan ürünleri ekleme
router.post("/addOutgoingProduct", upload.none(), async (req, res) => {
  try {
    const { documentDate, documentNumber, order, description, products } =
      req.body;
    const outgoingProduct = new OutgoingProduct({
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
      foundProduct.productQuantity -= parseInt(productQuantity, 10);
      await foundProduct.save();

      // Add product and quantity to outgoingProducts array
      outgoingProduct.products.push({
        product: foundProduct._id,
        quantity: parseInt(productQuantity, 10),
      });
    }

    await outgoingProduct.save();

    res.status(200).json({
      status: "success",
      message: "Çıkan ürün girişi başarıyla gerçekleştirildi.",
      outgoingProduct,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Çıkan ürünleri güncelleme
router.post("/updateOutgoingProduct", upload.none(), async (req, res) => {
  try {
    const { _id, documentDate, documentNumber, order, description, products } =
      req.body;

    // Mevcut çıkan ürün girişini bulma
    const outgoingProduct = await OutgoingProduct.findById(_id);
    if (!outgoingProduct) {
      throw new Error("Güncellenecek çıkan ürün girişi bulunamadı");
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
      const existingProduct = outgoingProduct.products.find(
        (item) => item.product && item.product.toString() === productId
      );

      if (existingProduct) {
        const parsedQuantity = parseInt(productQuantity, 10);
        const diffQuantity = parsedQuantity - existingProduct.quantity;

        // OutgoingProduct modelindeki quantity değerini güncelle
        existingProduct.quantity = parsedQuantity;

        // Product modelindeki quantity değerini güncelle
        foundProduct.productQuantity -= diffQuantity;
        await foundProduct.save();
      } else {
        // Yeni ürünleri güncellenen ürünler listesine ekle
        outgoingProduct.products.push({
          product: productId,
          quantity: parseInt(productQuantity, 10),
        });

        // Product modelindeki quantity değerini güncelle
        foundProduct.productQuantity -= parseInt(productQuantity, 10);
        await foundProduct.save();
      }
    }

    outgoingProduct.documentDate = documentDate;
    outgoingProduct.documentNumber = documentNumber;
    outgoingProduct.order = order;
    outgoingProduct.description = description;

    await outgoingProduct.save();

    res.status(200).json({
      status: "success",
      message: "Çıkan ürün girişi başarıyla güncellendi.",
      outgoingProduct,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Çıkan ürünleri silme
router.post("/removeOutgoingProduct", upload.none(), async (req, res) => {
  try {
    const { _id, productIdToRemove } = req.body;

    // Mevcut çıkan ürün girişini bulma
    const outgoingProduct = await OutgoingProduct.findById(_id);
    if (!outgoingProduct) {
      throw new Error("Güncellenecek çıkan ürün girişi bulunamadı");
    }

    // Çıkarılacak ürünü bul ve quantity değerini al
    const productToRemove = outgoingProduct.products.find(
      (product) => product.product.toString() === productIdToRemove
    );

    if (!productToRemove) {
      throw new Error("Çıkarılacak ürün listede bulunamadı");
    }

    const removedQuantity = productToRemove.quantity;

    // Ürünleri productId değerine göre filtrele ve productIdToRemove değerine sahip olanı çıkart
    outgoingProduct.products = outgoingProduct.products.filter(
      (product) => product.product.toString() !== productIdToRemove
    );

    // Çıkarılan ürünün quantity değerini Product modelinde artır
    const foundProduct = await Product.findById(productIdToRemove);
    if (foundProduct) {
      foundProduct.productQuantity += removedQuantity;
      await foundProduct.save();
    } else {
      throw new Error("Çıkarılacak ürünün veritabanında kaydı bulunamadı");
    }

    // outgoingProduct'i güncelle
    await outgoingProduct.save();

    res.status(200).json({
      status: "success",
      message: "Ürün başarıyla çıkartıldı.",
      outgoingProduct,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Çıkan ürünleri getirme
router.get("/getOutgoingProducts",  async (req, res) => {
  try {
    const outgoingProducts = await OutgoingProduct.find();
    res.status(200).json({
      status: "succes",
      message: "Çıkan ürün girişleri listelendi.",
      outgoingProducts,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});


//Bütün belgeleri getir

router.get("/allDocuments", async (req, res) => {
  try {
    const incomingProducts = await IncomingProduct.find();
    const outgoingProducts = await OutgoingProduct.find();

    // Tüm belgeleri bir dizi olarak birleştirme
    const data = [...incomingProducts, ...outgoingProducts];

    // updatedAt alanına göre en güncelden eskiye sıralama
    data.sort((a, b) => b.updatedAt - a.updatedAt);

    res.status(200).json({
      status: "success",
      message: "Tüm belgeler listelendi",
      allProducts,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});
 
// Tedarikçi ya da müşteriye ait tüm geçmiş işlemleri getir 
router.post("/listTransactions", upload.none(), async (req, res) => {
  try {
    const { _id } = req.body;
    
    // Tedarikçiye bağlı işlemleri çek
    const incomingTransactions = await IncomingProduct.find({ "order": _id })
      .populate("order")
      .populate("products.product");

    // Müşteriye bağlı işlemleri çek
    const outgoingTransactions = await OutgoingProduct.find({ "order": _id })
      .populate("order")
      .populate("products.product");

    res.status(200).json({
      status: "success",
      message: "İşlemler başarıyla çekildi.",
      incomingTransactions,
      outgoingTransactions,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});



module.exports = router;
