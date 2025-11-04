const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

// Гарантируем уникальность: одна категория с таким именем у одного пользователя
categorySchema.index({ name: 1, author: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);