const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    tcNumber: { type: Number, required: true, length: 11 },
    isim: { type: String, required: true },
    email: { type: String, required: true },
    telefon: { type: Number, required: true },
    adres: { type: String, required: true },
    ozellik: { type: String, enum: ["Tedarikçi", "Müşteri"], required: true },
  },
  { timestamps: true }
);


orderSchema.pre("save",function(next){
  if(this.ozellik !== "Tedarikçi" && this.ozellik !== "Müşteri"){
    return next(new Error("Ozellik Tedarikçi ya da Müşteri olmalıdır."))
  }
  next();
})


const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
