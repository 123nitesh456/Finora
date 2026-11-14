import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import Budget from '../models/Budget.js';
import asyncHandler from '../utils/asyncHandler.js';
import { monthRange, round2 } from '../utils/dates.js';

const sumByType = (rows, type) => round2(rows.find((r) => r._id === type)?.total || 0);
const countAll = (rows) => rows.reduce((n, r) => n + r.count, 0);

// GET /api/dashboard/summary?month=11&year=2026
// Every number is calculated from the user's transactions in MongoDB. Nothing is hardcoded.
export const getSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = Number(req.query.month) || now.getUTCMonth() + 1;
  const year = Number(req.query.year) || now.getUTCFullYear();

  const userId = new mongoose.Types.ObjectId(req.user.id); // aggregate() does not auto-cast ids
  const { start, end } = monthRange(year, month);
  const chartStart = new Date(Date.UTC(year, month - 6, 1)); // 6 months ending at the selected month
  const inMonth = { $gte: start, $lt: end };

  const [allTime, monthRows, breakdown, chartRows, recent, budget] = await Promise.all([
    // Lifetime totals
    Transaction.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    // Totals for the selected month
    Transaction.aggregate([
      { $match: { user: userId, date: inMonth } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    // Expense breakdown by category for the selected month
    Transaction.aggregate([
      { $match: { user: userId, type: 'expense', date: inMonth } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      {
        $lookup: {
          from: Category.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'cat',
        },
      },
      { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          name: { $ifNull: ['$cat.name', 'Uncategorized'] },
          icon: { $ifNull: ['$cat.icon', 'Tag'] },
          total: 1,
          count: 1,
        },
      },
      { $sort: { total: -1 } },
    ]),
    // Income vs expenses for the last 6 months
    Transaction.aggregate([
      { $match: { user: userId, date: { $gte: chartStart, $lt: end } } },
      {
        $group: {
          _id: { y: { $year: '$date' }, m: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
    ]),
    Transaction.find({ user: req.user._id })
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .populate('category', 'name icon type'),
    Budget.findOne({ user: req.user._id, month, year }),
  ]);

  // Build the 6-month chart, filling months without data with zeros.
  const monthlyChart = [];
  for (let i = 0; i < 6; i += 1) {
    const d = new Date(Date.UTC(year, month - 6 + i, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const pick = (type) => chartRows.find((r) => r._id.y === y && r._id.m === m && r._id.type === type)?.total || 0;
    monthlyChart.push({
      label: d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
      year: y,
      month: m,
      income: round2(pick('income')),
      expenses: round2(pick('expense')),
    });
  }

  const totalIncome = sumByType(allTime, 'income');
  const totalExpenses = sumByType(allTime, 'expense');
  const monthIncome = sumByType(monthRows, 'income');
  const monthExpenses = sumByType(monthRows, 'expense');

  // Budget maths: Remaining = Budget - Monthly Expenses, Percentage = Expenses / Budget x 100
  const budgetAmount = budget ? budget.amount : 0;
  const percentage = budget ? Math.round((monthExpenses / budgetAmount) * 1000) / 10 : 0;
  let status = 'none';
  if (budget) status = monthExpenses > budgetAmount ? 'exceeded' : percentage >= 80 ? 'warning' : 'safe';

  res.json({
    month,
    year,
    totals: { income: totalIncome, expenses: totalExpenses, balance: round2(totalIncome - totalExpenses) },
    monthly: {
      income: monthIncome,
      expenses: monthExpenses,
      net: round2(monthIncome - monthExpenses),
      transactionCount: countAll(monthRows),
    },
    budget: budget ? { _id: budget._id, amount: budget.amount, month, year } : null,
    budgetStats: {
      amount: budgetAmount,
      spent: monthExpenses,
      remaining: budget ? round2(budgetAmount - monthExpenses) : null,
      percentage,
      status, // none | safe | warning (>= 80%) | exceeded (> 100%)
    },
    categoryBreakdown: breakdown.map((b) => ({ ...b, total: round2(b.total) })),
    monthlyChart,
    recentTransactions: recent,
  });
});
