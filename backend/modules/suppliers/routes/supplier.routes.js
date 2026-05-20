import express from 'express';
import {
  getSuppliers,
  createSupplier,
  updateSupplier
} from '../controllers/supplier.controller.js';
import { protect, authorize } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin'), getSuppliers)
  .post(protect, authorize('admin'), createSupplier);

router.route('/:id')
  .put(protect, authorize('admin'), updateSupplier);

export default router;
