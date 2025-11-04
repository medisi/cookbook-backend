const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();
app.use(cors({
  origin: 'https://cook-book-pb5yeqg54-medisis-projects.vercel.app', // или '*' для теста
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Подключение к БД
connectDB();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Credentials', 'true'); // если нужны куки/токены
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});


// Маршруты
app.use('/api/auth', require('./routes/auth'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/profile', require('./routes/profile'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
