const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productCode: { type: String, required: true },
    productName: { type: String, required: true },
    productPrice: { type: Number, required: false },
    // productImage: {
    //   data: { type: String, required: false },
    //   contentType: { type: String, required: false },
    // },
    productQuantity: { type: Number, required: false },
    productPackageType: { type: String, required: false },
    productDescription: { type: String, required: false },
    productBarcode: { type: String, required: false },
    productAddress: { type: String, required: false },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
