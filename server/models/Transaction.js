import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title must be at most 100 characters'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
  },
  type: { type: String, enum: ['income', 'expense'], required: [true, 'Type is required'] },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  date: { type: Date, required: [true, 'Date is required'] },
  notes: { type: String, trim: true, maxlength: [500, 'Notes must be at most 500 characters'], default: '' },
  createdAt: { type: Date, default: Date.now },
});

// Indexes that match the most common queries (list by date, filter by type/category).
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });

export default mongoose.model('Transaction', transactionSchema);
