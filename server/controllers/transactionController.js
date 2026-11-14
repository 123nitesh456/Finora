import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import asyncHandler from '../utils/asyncHandler.js';
import httpError from '../utils/httpError.js';
import { parseDateOnly, round2 } from '../utils/dates.js';

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The category must belong to the logged-in user and match the transaction type.
const assertCategory = async (categoryId, userId, type) => {
  const category = await Category.findOne({ _id: categoryId, user: userId });
  if (!category) throw httpError(400, 'Selected category does not exist');
  if (category.type !== type) {
    throw httpError(400, `"${category.name}" is an ${category.type} category`);
  }
};

const populateCategory = (query) => query.populate('category', 'name icon type');

// GET /api/transactions?search=&type=&category=&startDate=&endDate=&sort=newest|oldest
export const getTransactions = asyncHandler(async (req, res) => {
  const { search, type, category, startDate, endDate, sort } = req.query;
  const filter = { user: req.user._id };

  if (typeof search === 'string' && search.trim()) {
    filter.title = { $regex: escapeRegex(search.trim()), $options: 'i' };
  }
  if (type === 'income' || type === 'expense') filter.type = type;
  if (typeof category === 'string' && category) filter.category = category;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = parseDateOnly(startDate);
    if (endDate) filter.date.$lte = parseDateOnly(endDate);
  }

  const direction = sort === 'oldest' ? 1 : -1;
  const transactions = await populateCategory(
    Transaction.find(filter).sort({ date: direction, createdAt: direction })
  );

  res.json({ count: transactions.length, transactions });
});

// POST /api/transactions
export const createTransaction = asyncHandler(async (req, res) => {
  const { title, amount, type, category, date, notes } = req.body;
  await assertCategory(category, req.user._id, type);

  const created = await Transaction.create({
    user: req.user._id, // from the JWT, never from the request body
    title,
    amount: round2(amount),
    type,
    category,
    date: parseDateOnly(date),
    notes,
  });

  const transaction = await populateCategory(Transaction.findById(created._id));
  res.status(201).json({ transaction });
});

// PUT /api/transactions/:id
export const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!transaction) throw httpError(404, 'Transaction not found');

  const { title, amount, type, category, date, notes } = req.body;
  await assertCategory(category, req.user._id, type);

  transaction.title = title;
  transaction.amount = round2(amount);
  transaction.type = type;
  transaction.category = category;
  transaction.date = parseDateOnly(date);
  transaction.notes = notes ?? '';
  await transaction.save();

  const updated = await populateCategory(Transaction.findById(transaction._id));
  res.json({ transaction: updated });
});

// DELETE /api/transactions/:id
export const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!transaction) throw httpError(404, 'Transaction not found');
  res.json({ message: 'Transaction deleted', id: transaction._id });
});
