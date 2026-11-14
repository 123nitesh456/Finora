import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import asyncHandler from '../utils/asyncHandler.js';
import httpError from '../utils/httpError.js';

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Case-insensitive duplicate check (Food vs food) within the same user and type.
const nameTaken = (userId, name, type, excludeId) =>
  Category.findOne({
    user: userId,
    type,
    name: { $regex: `^${escapeRegex(name.trim())}$`, $options: 'i' },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });

// GET /api/categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ user: req.user._id }).sort({ type: 1, name: 1 });
  res.json({ categories });
});

// POST /api/categories
export const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, type = 'expense' } = req.body;
  if (await nameTaken(req.user._id, name, type)) {
    throw httpError(409, `You already have an ${type} category named "${name.trim()}"`);
  }
  const category = await Category.create({ user: req.user._id, name, icon, type });
  res.status(201).json({ category });
});

// PUT /api/categories/:id  (name and icon can change; the type cannot)
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, user: req.user._id });
  if (!category) throw httpError(404, 'Category not found');

  const { name, icon } = req.body;
  if (await nameTaken(req.user._id, name, category.type, category._id)) {
    throw httpError(409, `You already have a category named "${name.trim()}"`);
  }
  category.name = name;
  if (icon) category.icon = icon;
  await category.save();
  res.json({ category });
});

// DELETE /api/categories/:id  (blocked while transactions still use it)
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, user: req.user._id });
  if (!category) throw httpError(404, 'Category not found');

  const inUse = await Transaction.countDocuments({ user: req.user._id, category: category._id });
  if (inUse > 0) {
    throw httpError(
      409,
      `"${category.name}" is used by ${inUse} transaction${inUse > 1 ? 's' : ''}. Move or delete them first.`
    );
  }

  await category.deleteOne();
  res.json({ message: 'Category deleted', id: category._id });
});
