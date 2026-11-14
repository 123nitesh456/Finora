import express from 'express';
import { body, query } from 'express-validator';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { parseDateOnly } from '../utils/dates.js';

const router = express.Router();
router.use(protect); // every transaction route is private

const isDate = (value) => !!parseDateOnly(value);

const transactionRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title is too long (max 100)'),
  body('amount').isFloat({ gt: 0, max: 1000000000 }).withMessage('Amount must be a number greater than 0'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('category').isMongoId().withMessage('A valid category is required'),
  body('date').custom(isDate).withMessage('Date must be a valid YYYY-MM-DD date'),
  body('notes').optional({ nullable: true }).isString().trim().isLength({ max: 500 }).withMessage('Notes are too long (max 500)'),
];

const listRules = [
  query('type').optional({ values: 'falsy' }).isIn(['income', 'expense']).withMessage('Invalid type filter'),
  query('category').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid category filter'),
  query('startDate').optional({ values: 'falsy' }).custom(isDate).withMessage('Invalid start date'),
  query('endDate').optional({ values: 'falsy' }).custom(isDate).withMessage('Invalid end date'),
  query('sort').optional({ values: 'falsy' }).isIn(['newest', 'oldest']).withMessage('Invalid sort option'),
];

router.get('/', listRules, validate, getTransactions);
router.post('/', transactionRules, validate, createTransaction);
router.put('/:id', validateObjectId, transactionRules, validate, updateTransaction);
router.delete('/:id', validateObjectId, deleteTransaction);

export default router;
