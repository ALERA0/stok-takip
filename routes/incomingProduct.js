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

// Sıradaki belge dokuman numarasını getiren endpoint
router.get("/getNextDocumentNumber", async (req, res) => {
  try {
    const sequenceDocument = await Counter.findById("documentNumber");

    if (!sequenceDocument) {
      // Eğer sayaç belirtilen ID ile bulunamazsa (ilk defa istek atılıyorsa)
      // sayaç oluşturup değeri 1 olarak başlatın
      const newSequenceDocument = new Counter({ _id: "documentNumber", sequence_value: 1 });
      await newSequenceDocument.save();

      res.status(200).json({ nextDocumentNumber: "00001" });
    } else {
      const nextDocumentNumber = (sequenceDocument.sequence_value + 1).toString().padStart(5, "0");
      res.status(200).json({ nextDocumentNumber });
    }
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching the next document number." });
  }
});


//Yeni bir gelen ürün belgesi ekleyen  endpoint
router.post("/addIncomingProduct", upload.none(), async (req, res) => {
  try {
    const { documentDate, order, description } = req.body;

    const sequenceValue = await getNextSequenceValue("documentNumber");

    const data = new IncomingProduct({
      documentDate,
      documentNumber: sequenceValue.toString().padStart(5, "0"), // Örneğin: 00001
      order,
      description,
      products: [],
    });

    await data.save();

    res.status(200).json({
      status: "success",
      message: "Ürün girişi başarıyla oluşturuldu.",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

//Yeni ürün belgesine ürün ekleyen endpoint
router.post("/addProductToIncomingProduct", upload.none(), async (req, res) => {
  try {
    const { incomingProductId, productId, productQuantity } = req.body;

    const data = await IncomingProduct.findById(incomingProductId);
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

    // Product modelindeki quantity değerini güncelle
    foundProduct.productQuantity += parseInt(productQuantity, 10);
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

// Gelen belgesindeki ürünlerin adedini güncelle
router.post(
  "/updateIncomingProductQuantity",
  upload.none(),
  async (req, res) => {
    try {
      const { incomingProductId, rowId, newQuantity } = req.body;

      const data = await IncomingProduct.findById(incomingProductId);
      if (!data) {
        throw new Error("Güncellenecek ürün girişi bulunamadı");
      }

      const existingProduct = data.products.find(
        (item) => item._id.toString() === rowId
      );
      if (!existingProduct) {
        throw new Error("Ürün girişi bulunamadı");
      }

      const parsedNewQuantity = parseInt(newQuantity, 10);
      if (isNaN(parsedNewQuantity) || parsedNewQuantity <= 0) {
        throw new Error("Yeni quantity değeri geçerli bir sayı değil");
      }

      // Eski quantity değerini bulup, farkını hesapla
      const diffQuantity = parsedNewQuantity - existingProduct.quantity;

      // IncomingProduct modelindeki quantity değerini güncelle
      existingProduct.quantity = parsedNewQuantity;

      // Product modelindeki quantity değerini güncelle
      const foundProduct = await Product.findById(existingProduct.product);
      if (!foundProduct) {
        throw new Error("Ürün bulunamadı");
      }
      foundProduct.productQuantity += diffQuantity;
      await foundProduct.save();

      await data.save();

      res.status(200).json({
        status: "success",
        message: "Ürün girişi başarıyla güncellendi.",
        data,
      });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
);

// Girilen ürünleri güncelleme
router.post("/updateIncomingProduct", upload.none(), async (req, res) => {
  try {
    const { _id, documentDate, order, description } =
      req.body;

    // Mevcut ürün girişini bulma
    const incomingProduct = await IncomingProduct.findById(_id);
    if (!incomingProduct) {
      throw new Error("Güncellenecek ürün girişi bulunamadı");
    }




   

    incomingProduct.documentDate = documentDate;
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

//Girilen ürünler datasında bir ürün silme
router.post("/removeProduct", upload.none(), async (req, res) => {
  try {
    const { incomingProductId,rowId  } = req.body;

    // Mevcut ürün girişini bulma
    const incomingProduct = await IncomingProduct.findById(incomingProductId);
    if (!incomingProduct) {
      throw new Error("Güncellenecek ürün girişi bulunamadı");
    }

    // Çıkarılacak ürünü bul ve quantity değerini al
    const productToRemove = incomingProduct.products.find(
      (product) => product._id.toString() === rowId
    );

    if (!productToRemove) {
      throw new Error("Çıkarılacak ürün listede bulunamadı");
    }

    const removedQuantity = productToRemove.quantity;

    // Ürünleri productId değerine göre filtrele ve productIdToRemove değerine sahip olanı çıkart
    incomingProduct.products = incomingProduct.products.filter(
      (product) => product._id.toString() !== rowId
    );

    // Çııııkarılan ürünün quantity değerini Product modelinde azalt
    const foundProduct = await Product.findById(productToRemove.product);
    if (foundProduct) {
      foundProduct.productQuantity -= removedQuantity;
      await foundProduct.save();
    } else {
      throw new Error("Çıkarılacak ürünün veritabanında kaydı bulunamadı");
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

// Ürün giriş belgelerini getirme
router.get("/getIncomingProducts", upload.none(), async (req, res) => {
  try {
    const incomingProducts = await IncomingProduct.find().populate("order", "_id isim");
    res.status(200).json({
      status: "success",
      message: "Ürün girişleri listelendi.",
      incomingProducts,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

//Üürnn giriş belgesi detayı
router.post("/incomingProductdetail", upload.none(), async (req, res) => {
  try {
    const { incomingProductId } = req.body;
    const data = await IncomingProduct.findById(incomingProductId)
      .populate("products.product", "productName productCode productDescription productQuantity").populate("order", "_id isim");

    if (!data) {
      throw new Error("Ürün girişi bulunamadı");
    }
    
    res.status(200).json({
      status: "success",
      message: "Ürün giriş belgesi detayı başarıyla getirildi",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});


module.exports = router;