import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getDashboardStats,
} from '../controllers/product.controller.js';
import { protect, authorize, authorizeManager } from '../../../middleware/authMiddleware.js';
import { uploadProductImage } from '../../../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(protect, authorizeManager, uploadProductImage, createProduct);

router.route('/low-stock')
  .get(protect, authorize('admin'), getLowStockProducts);

router.route('/dashboard-stats')
  .get(protect, authorize('admin'), getDashboardStats);

router.route('/:id')
  .get(getProductById)
  .put(protect, authorizeManager, uploadProductImage, updateProduct)
  .delete(protect, authorize('admin'), deleteProduct);

export default router;
