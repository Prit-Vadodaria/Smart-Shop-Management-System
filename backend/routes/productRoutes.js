import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getDashboardStats,
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(protect, authorize('Admin', 'Manager', 'Staff'), createProduct);

router.route('/low-stock')
  .get(protect, authorize('Admin', 'Manager'), getLowStockProducts);

router.route('/dashboard-stats')
  .get(protect, authorize('Admin', 'Manager'), getDashboardStats);

router.route('/:id')
  .get(getProductById)
  .put(protect, authorize('Admin', 'Manager'), updateProduct)
  .delete(protect, authorize('Admin', 'Manager'), deleteProduct);

export default router;
