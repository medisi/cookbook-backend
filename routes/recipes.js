const express = require('express');
const multer = require('multer');
const path = require('path');
const Recipe = require('../models/Recipe');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Получить все рецепты (с фильтром по категории)
router.get('/', async (req, res) => {
    try {
        const { category, userId } = req.query;
        let filter = {};
        if (category) {
            filter.category = category;
        }
        if (userId) {
            filter.author = userId;  // ← ключевое изменение!
        }
        const recipes = await Recipe.find(filter).populate('author');
        res.json(recipes);
    } catch (err) {
        console.error('Ошибка получения рецептов:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Создать рецепт
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        // console.log('Файл:', req.file);
        console.log('Полученные данные:', req.body);

        const { title, category, description, prepTime, servings, ingredients, steps } = req.body;

        // Парсим JSON
        const parsedIngredients = JSON.parse(ingredients || '[]');
        const parsedSteps = JSON.parse(steps || '[]');

        // Парсим числа
        const numPrepTime = parseInt(prepTime);
        const numServings = parseInt(servings);

        // Валидация
        if (!title || !category || category === "" || isNaN(numPrepTime) || isNaN(numServings) || parsedIngredients.length === 0 || parsedSteps.length === 0) {
            return res.status(400).json({ message: 'Неверные данные: проверьте поля' });
        }

        const recipe = new Recipe({
            title,
            category,
            description,
            prepTime: numPrepTime,
            servings: numServings,
            ingredients: parsedIngredients,
            steps: parsedSteps,
            author: req.user.id,
            image: req.file ? req.file.filename : '',
        });

        await recipe.save();
        res.status(201).json(recipe);
    } catch (err) {
        console.error('Ошибка:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});


// Обновить рецепт
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!recipe) return res.status(404).json({ message: 'Рецепт не найден' });
        res.json(recipe);
    } catch (err) {
        console.error('Ошибка обновления рецепта:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Удалить рецепт
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const recipe = await Recipe.findByIdAndDelete(req.params.id);
        if (!recipe) return res.status(404).json({ message: 'Рецепт не найден' });
        res.status(204).send();
    } catch (err) {
        console.error('Ошибка удаления рецепта:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// GET /api/recipes/:id - получение одного рецепта
router.get('/:id', async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id).populate('author');
        if (!recipe) return res.status(404).json({ message: 'Рецепт не найден' });
        res.json(recipe);
    } catch (err) {
        console.error('Ошибка:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;