import { validationResult } from 'express-validator';

// Runs after express-validator rules. Returns 400 with the first error message.
export const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ message: errors[0].message, errors });
};

// Rejects malformed MongoDB ids in the URL (e.g. /api/transactions/abc).
export const validateObjectId = (req, res, next) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  next();
};
