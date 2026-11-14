import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [0.01, 'Budget must be greater than 0'],
  },
  month: { type: Number, required: true, min: 1, max: 12 }, // 1 = January
  year: { type: Number, required: true, min: 2000, max: 2100 },
});

// One budget per user per month.
budgetSchema.index({ user: 1, year: 1, month: 1 }, { unique: true });

export default mongoose.model('Budget', budgetSchema);
