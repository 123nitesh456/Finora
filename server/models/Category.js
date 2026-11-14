import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [30, 'Category name must be at most 30 characters'],
  },
  icon: { type: String, default: 'Tag', trim: true, maxlength: 40 },
  type: { type: String, enum: ['expense', 'income'], default: 'expense' },
});

// A user cannot have two categories with the same name and type.
categorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

export default mongoose.model('Category', categorySchema);
