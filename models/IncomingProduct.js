const mongoose = require("mongoose");

const IncomingProductSchema = new mongoose.Schema({
  documentDate: {
    type: Date,
    default: Date.now,
  },
  documentNumber: { type: String, required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", require: false },
  description: { type: String, required: false },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        require: false,
      },
      quantity: { type: Number, required: true, default: 0 },
    },
  ],
});

// Tarih alanını yyyy-mm-dd formatına dönüştürme
IncomingProductSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.documentDate = ret.documentDate.toISOString().split("T")[0];
    return ret;
  },
});

const IncomingProduct = mongoose.model(
  "IncomingProduct",
  IncomingProductSchema
);

module.exports = IncomingProduct;
