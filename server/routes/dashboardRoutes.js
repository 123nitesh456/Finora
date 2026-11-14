import express from 'express';
import { query } from 'express-validator';
import { getSummary } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();
router.use(protect);

router.get(
  '/summary',
  [
    query('month').optional({ values: 'falsy' }).isInt({ min: 1, max: 12 }).withMessage('Month must be 1-12'),
    query('year').optional({ values: 'falsy' }).isInt({ min: 2000, max: 2100 }).withMessage('Invalid year'),
  ],
  validate,
  getSummary
);

export default router;
