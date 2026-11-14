import Budget from '../models/Budget.js';
import asyncHandler from '../utils/asyncHandler.js';
import httpError from '../utils/httpError.js';
import { round2 } from '../utils/dates.js';

// GET /api/budgets?month=11&year=2026   (month/year are optional filters)
export const getBudgets = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.month) filter.month = Number(req.query.month);
  if (req.query.year) filter.year = Number(req.query.year);

  const budgets = await Budget.find(filter).sort({ year: -1, month: -1 });
  res.json({ budgets });
});

// POST /api/budgets  -> sets the budget for a month (creates it, or updates it if it already exists)
export const createBudget = asyncHandler(async (req, res) => {
  const month = Number(req.body.month);
  const year = Number(req.body.year);
  const amount = round2(req.body.amount);

  const existing = await Budget.findOne({ user: req.user._id, month, year });
  if (existing) {
    existing.amount = amount;
    await existing.save();
    return res.json({ budget: existing });
  }

  const budget = await Budget.create({ user: req.user._id, amount, month, year });
  res.status(201).json({ budget });
});

// PUT /api/budgets/:id
export const updateBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });
  if (!budget) throw httpError(404, 'Budget not found');

  budget.amount = round2(req.body.amount);
  await budget.save();
  res.json({ budget });
});
