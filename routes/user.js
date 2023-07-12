const User = require("../models/User");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const activeTokens = {};


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
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'E-posta veya şifre bilgileri yanlış' });
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
      return res.status(401).json({ status: 'error', message: 'E-posta veya şifre bilgileri yanlış' });
    }

    // Aktif bir JWT oluşturup cihaza atama
    const token = generateJWT(user);
    assignTokenToDevice(user.email, token);

    res.status(200).json({ status: 'success', user, token });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
});

router.post('/logout', (req, res) => {
  const { token } = req.body;

  // JWT'yi aktif cihazlardan kaldırma
  removeTokenFromDevices(token);

  res.status(200).json({ status: 'success', message: 'Çıkış yapıldı' });
});



function generateJWT(user) {
  const token = jwt.sign({ userId: user.id }, 'gizliAnahtar', { expiresIn: '1h' });
  return token;
}

// JWT'yi cihaza atama
function assignTokenToDevice(email, token) {
  if (!activeTokens[email]) {
    activeTokens[email] = [token];
  } else {
    activeTokens[email].push(token);
  }
}

// JWT'yi aktif cihazlardan kaldırma
function removeTokenFromDevices(token) {
  for (const email in activeTokens) {
    const tokens = activeTokens[email];
    const index = tokens.indexOf(token);
    if (index !== -1) {
      tokens.splice(index, 1);
    }
  }
}

// Middleware: JWT doğrulama
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Geçersiz JWT' });
  }

  jwt.verify(token, 'gizliAnahtar', (err, user) => {
    if (err) {
      return res.status(403).json({ status: 'error', message: 'Geçersiz JWT' });
    }

    const { email } = user;
    const tokens = activeTokens[email];
    if (!tokens || !tokens.includes(token)) {
      return res.status(401).json({ status: 'error', message: 'Geçersiz JWT veya oturum sonlandırılmış' });
    }

    req.user = user;
    next();
  });
}



module.exports = router;
