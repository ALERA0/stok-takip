const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    tcNumber: { type: Number, required: true, length: 11 },
    isim: { type: String, required: true },
    email: { type: String, required: true },
    telefon: { type: Number, required: true },
    adres: { type: String, required: true },
    ozellik: { type: String, required: true },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
