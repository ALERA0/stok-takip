const OutgoingProduct = require("../models/OutgoingProduct.js");
const IncomingProduct = require("../models/IncomingProduct.js");
const express = require("express");
const app = express();
const router = express.Router();
const multer = require("multer");
const Product = require("../models/Product.js");
const upload = multer();
const mongoose = require("mongoose");
const Counter = require("../models/Counter.js");
app.use(express.json());

async function getNextSequenceValue(sequenceName) {
  const sequenceDocument = await Counter.findByIdAndUpdate(
    sequenceName,
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );

  return sequenceDocument.sequence_value;
}

// Çıkan ürünleri ekleme
router.post("/addOutgoingProduct", upload.none(), async (req, res) => {
  try {
    const { documentDate, order, description } = req.body;

    const sequenceValue = await getNextSequenceValue("documentNumber");

    const data = new OutgoingProduct({
      documentDate,
      documentNumber: sequenceValue.toString().padStart(5, "0"),
      order,
      description,
      products: [], // Ürünleri buraya tek tek eklemeyeceğiz, başka bir endpoint ile yapacağız
    });

    await data.save();

    res.status(200).json({
      status: "success",
      message: "Ürün çıkışı başarıyla oluşturuldu.",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Ürün çıkış belgesine ürün ekleme
router.post("/addProductToOutgoingProduct", upload.none(), async (req, res) => {
  try {
    const { outgoingProductId, productId, productQuantity } = req.body;

    const data = await OutgoingProduct.findById(outgoingProductId);
    if (!data) {
      throw new Error("Giriş belgesi bulunamadı");
    }

    const foundProduct = await Product.findById(productId);
    if (!foundProduct) {
      throw new Error("Ürün bulunamadı");
    }

    const parsedQuantity = parseInt(productQuantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      throw new Error("Geçerli bir ürün miktarı girin");
    }

    if (parsedQuantity > foundProduct.productQuantity) {
      return res.status(400).json({
        status: "error",
        message: "Stokta yeterli ürün sayısı yok",
        availableQuantity: foundProduct.productQuantity,
      });
    }

    // Product modelindeki quantity değerini güncelle
    foundProduct.productQuantity -= parseInt(productQuantity, 10);
    await foundProduct.save();

    // Add product and quantity to incomingProducts array
    data.products.push({
      product: foundProduct._id,
      quantity: parseInt(productQuantity, 10),
    });

    await data.save();

    res.status(200).json({
      status: "success",
      message: "Ürün girişi başarıyla gerçekleştirildi.",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

//Ürün çıkış belgesine eklenen ürünleri update etme
router.post(
  "/updateOutgoingProductQuantity",
  upload.none(),
  async (req, res) => {
    try {
      const { outgoingProductId, rowId, newQuantity } = req.body;

      const data = await OutgoingProduct.findById(outgoingProductId);
      if (!data) {
        throw new Error("Güncellenecek ürün çıkışı bulunamadı");
      }

      const existingProduct = data.products.find(
        (item) => item._id.toString() === rowId
      );
      if (!existingProduct) {
        throw new Error("Ürün çıkışı bulunamadı");
      }

      const parsedNewQuantity = parseInt(newQuantity, 10);
      if (isNaN(parsedNewQuantity) || parsedNewQuantity < 0) {
        throw new Error("Yeni quantity değeri geçerli bir sayı değil");
      }

      // Eski miktarı da güncelle
      const oldQuantity = existingProduct.quantity;

      // Mevcut çıkış miktarını hesapla
      const currentQuantity = data.products.reduce((total, item) => {
        if (item._id.toString() === rowId) {
          return total;
        }
        return total + item.quantity;
      }, 0);

      // Toplam çıkış miktarını bul
      const totalQuantity = currentQuantity + parsedNewQuantity - oldQuantity;

      // Product modelindeki stok miktarını kontrol et
      const foundProduct = await Product.findById(existingProduct.product);
      if (!foundProduct) {
        throw new Error("Ürün bulunamadı");
      }

      // Stok miktarı sıfırdan küçük olmamalı ve stok adedini aşmamalı
      if (
        foundProduct.productQuantity - totalQuantity < 0 ||
        foundProduct.productQuantity < totalQuantity
      ) {
        throw new Error("Stokta yeterli ürün yok");
      }

      // Eski quantity değerini güncelle
      existingProduct.quantity = parsedNewQuantity;

      // Product modelindeki quantity değerini güncelle
      foundProduct.productQuantity += oldQuantity - parsedNewQuantity;
      await foundProduct.save();

      await data.save();

      res.status(200).json({
        status: "success",
        message: "Ürün çıkışı başarıyla güncellendi.",
        data,
      });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
);

// Çıkan ürünleri güncelleme
router.post("/updateOutgoingProduct", upload.none(), async (req, res) => {
  try {
    const { _id, documentDate, order, description } = req.body;

    // Mevcut çıkan ürün girişini bulma
    const outgoingProduct = await OutgoingProduct.findById(_id);
    if (!outgoingProduct) {
      throw new Error("Güncellenecek çıkan ürün girişi bulunamadı");
    }

    // Veri tiplerini kontrol etmek için forEach ile tüm ürünleri dönüyoruz

    // Güncellenen ürünün quantity farkını hesapla

    outgoingProduct.documentDate = documentDate;
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
    const { outgoingProductId, rowId } = req.body;

    // Mevcut çıkan ürün girişini bulma
    const outgoingProduct = await OutgoingProduct.findById(outgoingProductId);
    if (!outgoingProduct) {
      throw new Error("Güncellenecek  ürün çıkış belgesi bulunamadı");
    }

    // Çıkarılacak ürünü bul ve quantity değerini al
    const productToRemove = outgoingProduct.products.find(
      (product) => product._id.toString() === rowId
    );

    if (!productToRemove) {
      throw new Error("Çıkarılacak ürün listede bulunamadı");
    }

    const removedQuantity = productToRemove.quantity;

    // Ürünleri productId değerine göre filtrele ve productIdToRemove değerine sahip olanı çıkart
    outgoingProduct.products = outgoingProduct.products.filter(
      (product) => product._id.toString() !== rowId
    );

    // Çıkarılan ürünün quantity değerini Product modelinde artır
    const foundProduct = await Product.findById(productToRemove.product);
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
router.get("/getOutgoingProducts", async (req, res) => {
  try {
    const outgoingProducts = await OutgoingProduct.find().populate(
      "order",
      "_id isim"
    );
    res.status(200).json({
      status: "success",
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
    const incomingProducts = await IncomingProduct.find().populate(
      "order",
      "_id isim"
    );
    const outgoingProducts = await OutgoingProduct.find().populate(
      "order",
      "_id isim"
    );

    // Tüm belgeleri bir dizi olarak birleştirme
    const data = [...incomingProducts, ...outgoingProducts];

    // updatedAt alanına göre en güncelden eskiye sıralama
    data.sort((a, b) => b.updatedAt - a.updatedAt);

    res.status(200).json({
      status: "success",
      message: "Tüm belgeler listelendi",
      data,
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
    const incomingTransactions = await IncomingProduct.find({ order: _id })
      .populate("order")
      .populate("products.product");

    // Müşteriye bağlı işlemleri çek
    const outgoingTransactions = await OutgoingProduct.find({ order: _id })
      .populate("order")
      .populate("products.product");

    const data = [...incomingTransactions, ...outgoingTransactions];

    res.status(200).json({
      status: "success",
      message: "İşlemler başarıyla çekildi.",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

//Ürün çıkış belgesi detay
router.post("/outgoingProductdetail", upload.none(), async (req, res) => {
  try {
    const { outgoingProductId } = req.body;
    const data = await OutgoingProduct.findById(outgoingProductId)
      .populate(
        "products.product",
        "productName productCode productDescription productQuantity"
      )
      .populate("order", "_id isim");
    if (!data) {
      throw new Error("Ürün çıkışı bulunamadı");
    }
    res.status(200).json({
      status: "success",
      message: "Ürün çıkış belgesi detayı başarıyla getirildi",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
