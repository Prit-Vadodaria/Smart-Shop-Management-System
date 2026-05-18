import express from 'express';
import {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  getMyOrders,
  getOrders,
  assignOrderToStaff,
  cancelOrder,
  deleteOrder,
  subscriptionCheckout
} from '../controllers/billing.controller.js';
import { protect, authorize } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, addOrderItems)
  .get(protect, authorize('Admin', 'Manager', 'Staff'), getOrders);

router.route('/subscription-checkout').post(protect, authorize('Admin', 'Manager'), subscriptionCheckout);

router.route('/myorders').get(protect, getMyOrders);

router.route('/:id')
  .get(protect, getOrderById)
  .delete(protect, authorize('Admin', 'Manager'), deleteOrder);

router.route('/:id/pay').put(protect, updateOrderToPaid);

router.route('/:id/status').put(protect, authorize('Admin', 'Manager', 'Staff'), updateOrderStatus);

router.route('/:id/assign').put(protect, authorize('Admin', 'Manager'), assignOrderToStaff);

router.route('/:id/cancel').put(protect, cancelOrder);

export default router;
