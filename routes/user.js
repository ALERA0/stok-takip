const User = require("../models/User");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const multer = require("multer");

const upload = multer();

//Yeni bir kullanıcı ekle
router.post("/login", upload.none(), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kullanıcıyı bulmak için gerekli işlemleri gerçekleştirin
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Şifre ya da E-Mail bilgileri yanlış" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res
        .status(403)
        .json({ status: "error", message: "Şifre ya da E-Mail bilgileri yanlış" });
    }

    res.status(200).json({ status: "success", user });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});


// Login doğrulama işlemi




router.post("/logout", async (req, res) => {
  try {
    // Kullanıcının oturumunu sonlandırmak için gerekli işlemler
    // Örneğin, kullanıcının token'ını geçersiz hale getirebilirsiniz

    res.status(200).json({ status: "success", message: "Oturum kapatıldı" });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});



module.exports = router;
