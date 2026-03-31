import express from 'express';
import {
  getSuppliers,
  createSupplier,
  updateSupplier
} from '../controllers/supplierController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('Admin', 'Manager'), getSuppliers)
  .post(protect, authorize('Admin', 'Manager'), createSupplier);

router.route('/:id')
  .put(protect, authorize('Admin', 'Manager'), updateSupplier);

export default router;
