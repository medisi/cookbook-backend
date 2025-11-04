const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router(); // Это важно — создаёт router

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { username, phone, email, password } = req.body;
    if (!username || !phone || !email || !password) return res.status(400).json({ message: 'Все поля обязательны' });

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) return res.status(400).json({ message: 'Пользователь с такой почтой или номером телефона уже существует' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, phone, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'Регистрация успешна' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Логин
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;