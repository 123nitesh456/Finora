import express from 'express';
import { body, query } from 'express-validator';
import { getBudgets, createBudget, updateBudget } from '../controllers/budgetController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate, validateObjectId } from '../middleware/validate.js';

const router = express.Router();
router.use(protect);

const amountRule = body('amount')
  .isFloat({ gt: 0, max: 1000000000 })
  .withMessage('Budget must be a number greater than 0');

router.get(
  '/',
  [
    query('month').optional({ values: 'falsy' }).isInt({ min: 1, max: 12 }).withMessage('Month must be 1-12'),
    query('year').optional({ values: 'falsy' }).isInt({ min: 2000, max: 2100 }).withMessage('Invalid year'),
  ],
  validate,
  getBudgets
);
router.post(
  '/',
  [
    amountRule,
    body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be 1-12'),
    body('year').isInt({ min: 2000, max: 2100 }).withMessage('Year must be between 2000 and 2100'),
  ],
  validate,
  createBudget
);
router.put('/:id', validateObjectId, [amountRule], validate, updateBudget);

export default router;
