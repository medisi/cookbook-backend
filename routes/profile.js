const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const Category = require('../models/Category');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/profile - получение профиля текущего пользователя
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

        // подсчёт количества рецептов и категорий
        const recipesCount = await Recipe.countDocuments({ author: req.user.id });
        const categoriesCount = await Category.countDocuments({ author: req.user.id });

        // расчёт возраста по указанной дате
        let age = null;
        if (user.birthDate) {
            const today = new Date();
            const birth = new Date(user.birthDate);
            age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
        }

        res.json({
            username: user.username,
            email: user.email,
            phone: user.phone || '',
            recipesCount,
            categoriesCount,
        });
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// PUT /api/profile - обновление профиля текущего пользователя (исправлено с GET на PUT)
router.put('/', authMiddleware, async (req, res) => {
    try {
        const { username, email, phone, birthDate, oldPassword, newPassword } = req.body;
        
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

        // Если пытаемся изменить пароль, проверим старый
        if (newPassword) {
            if (!oldPassword) {
                return res.status(400).json({ message: 'Необходимо указать старый пароль' });
            }
            const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
            if (!isOldPasswordValid) {
                return res.status(400).json({ message: 'Старый пароль неверный' });
            }
            // Хэшируем новый пароль
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedNewPassword;
        }

        // Обновить другие поля
        if (username) user.username = username;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (birthDate) user.birthDate = birthDate;

        await user.save();
        res.json({ message: 'Профиль обновлён' });
    } catch (err) {
        if (err.code === 11000) {   // дубликат
            res.status(400).json({ message: 'Email или имя пользователя уже заняты' });
        } else {
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }
});

module.exports = router;