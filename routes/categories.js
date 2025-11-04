const express = require('express');
const Category = require('../models/Category');
const authMiddleware = require('../middleware/auth'); // проверка токена
const mongoose = require('mongoose');

const router = express.Router();

// GET /api/categories - получение категорий пользователя
router.get('/', authMiddleware, async (req, res) => {
    try {
        const categories = await Category.find({ author: req.user.id }).sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: 'Error server' });
    }
});

// POST /api/categories - создание новой категории
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Название категории обязательно' });

        const existing = await Category.findOne({ name, author: req.user.id });
        if (existing) return res.status(400).json({ message: 'Категория с таким названием уже существует' });

        const category = new Category({
            name,
            author: req.user.id,
        });
        const saved = await category.save();
        res.status(201).json(saved);
    }
    //  catch (err) {
    //     console.error('Ошибка при сохранении категории:', err); // <-- Добавить
    //     res.status(500).json({ message: 'Ошибка сервера' });
    // }
    
    catch (err) {
        console.error('Серверная ошибка при создании категории:', err); // <-- Ключевая строка
        console.error('Детали ошибки:', {
            message: err.message,
            stack: err.stack,
            name: err.name,
            code: err.code
        });
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// PUT /api/categories/:id - обновление категории
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Название категории обязательно' });

        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Категория не найдена' });

        if (category.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Нет прав на редактирование' });
        }

        // Проверка уникальности по пользователю (исключая текущую категорию)
        const existing = await Category.findOne({ name, author: req.user.id, _id: { $ne: req.params.id } });
        if (existing) return res.status(400).json({ message: 'Категория с таким названием уже существует' });


        category.name = name;
        await category.save();
        res.json(category);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// DELETE /api/categories/:id - удаление категории
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Категория не найдена' });
        
        if (category.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Нет прав на удаление' });
        }

        await Category.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;
