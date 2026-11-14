import User from '../models/User.js';
import Category from '../models/Category.js';
import asyncHandler from '../utils/asyncHandler.js';
import httpError from '../utils/httpError.js';
import generateToken from '../utils/generateToken.js';
import { DEFAULT_CATEGORIES } from '../utils/defaultCategories.js';

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) throw httpError(409, 'An account with this email already exists');

  const user = await User.create({ name, email, password }); // password hashed in the model

  // Give the new user their own copy of the default categories.
  await Category.insertMany(DEFAULT_CATEGORIES.map((c) => ({ ...c, user: user._id })));

  res.status(201).json({ token: generateToken(user._id), user });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  // Same message for "no such user" and "wrong password" so emails cannot be probed.
  if (!user || !(await user.matchPassword(password))) {
    throw httpError(401, 'Invalid email or password');
  }

  res.json({ token: generateToken(user._id), user });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
