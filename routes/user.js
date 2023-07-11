const UserSchema = require("../models/User");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");


//Yeni bir kullanıcı ekle
router.post("/user-post", async (req, res) => {
  try {
    const { email, password } = new UserSchema(req.body);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new UserSchema({
      email,
      password: hashedPassword,

    });
    await newUser.save();   
    res.status(200).json(newUser);
  } catch (error) {
    res.status(500).json(error);
  }
});


// Login doğrulama işlemi
router.post("/login", async (req, res) => {
    try {
      const user = await UserSchema.findOne({ email: req.body.email });
      if (!user) {
        return res.status(400).json("User not found");
      }
  
      const validPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (!validPassword) {
        res.status(403).json("Invalid password");
      } else {
        res.status(200).json(user);
      }
    } catch (error) {
      res.status(400).json(error);
    }
  });

module.exports = router;
