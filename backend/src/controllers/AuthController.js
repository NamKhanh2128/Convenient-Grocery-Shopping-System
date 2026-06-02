const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserModel = require('../models/UserModel');
const ShoppingModel = require('../models/ShoppingModel');
const express = require('express');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const validation = UserModel.validateLogin(email, password);
    if (!validation.isValid) return res.status(400).json({ errors: validation.errors });

    const user = await UserModel.findByEmail(email);
    if (!user) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });

    const familyId = await ShoppingModel.getUserFamilyId(user.id);

    const token = jwt.sign(
      { user_id: user.id, email: user.email, full_name: user.full_name },
      process.env.JWT_SECRET || 'dev-secret-change-me',
      { expiresIn: process.env.JWT_EXPIRES || '7d' }
    );

    res.json({
      token,
      user: { user_id: user.id, email: user.email, full_name: user.full_name, family_id: familyId },
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ.' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const userData = req.body;
    const validation = UserModel.validateRegister(userData);
    if (!validation.isValid) return res.status(400).json({ errors: validation.errors });

    const exists = await UserModel.findByEmail(userData.email);
    if (exists) return res.status(409).json({ message: 'Email đã được sử dụng.' });

    const hash = await bcrypt.hash(userData.password, 10);
    const userId = await UserModel.create({ ...userData, passwordHash: hash });

    const token = jwt.sign(
      { user_id: userId, email: userData.email, full_name: userData.fullName },
      process.env.JWT_SECRET || 'dev-secret-change-me',
      { expiresIn: process.env.JWT_EXPIRES || '7d' }
    );

    res.status(201).json({
      token,
      user: { user_id: userId, email: userData.email, full_name: userData.fullName, family_id: null },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ.' });
  }
});

module.exports = { router };
