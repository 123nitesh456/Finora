import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import httpError from '../utils/httpError.js';

// Protects private routes. The user id ALWAYS comes from the verified token,
// never from the request body, query or URL.
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    throw httpError(401, 'Not authorized. Please log in.');
  }

  let decoded;
  try {
    decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
  } catch {
    throw httpError(401, 'Session expired or invalid. Please log in again.');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw httpError(401, 'User no longer exists. Please sign up again.');

  req.user = user;
  next();
});
