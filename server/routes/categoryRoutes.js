import express from 'express';
import { body } from 'express-validator';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate, validateObjectId } from '../middleware/validate.js';

const router = express.Router();
router.use(protect);

const categoryRules = [
  body('name').trim().notEmpty().withMessage('Category name is required').isLength({ max: 30 }).withMessage('Category name is too long (max 30)'),
  body('icon').optional({ values: 'falsy' }).isString().matches(/^[A-Za-z0-9]{1,40}$/).withMessage('Invalid icon'),
  body('type').optional().isIn(['expense', 'income']).withMessage('Type must be expense or income'),
];

router.get('/', getCategories);
router.post('/', categoryRules, validate, createCategory);
router.put('/:id', validateObjectId, categoryRules, validate, updateCategory);
router.delete('/:id', validateObjectId, deleteCategory);

export default router;
