import express from 'express';
import {
  createSubscription,
  createBulkSubscriptions,
  getMySubscriptions,
  updateSubscriptionStatus,
  toggleVacationMode,
  getActiveSubscriptions,
  getAllSubscriptions,
  generateDailyOrders
} from '../controllers/subscriptionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createSubscription)
  .get(protect, authorize('Admin', 'Manager'), getAllSubscriptions);

router.route('/generate-orders')
  .post(protect, authorize('Admin', 'Manager'), generateDailyOrders);

router.route('/active')
  .get(protect, authorize('Admin', 'Manager'), getActiveSubscriptions);

router.route('/bulk')
  .post(protect, createBulkSubscriptions);

router.route('/my-subscriptions')
  .get(protect, getMySubscriptions);

router.route('/:id/status')
  .put(protect, updateSubscriptionStatus);

router.route('/:id/vacation')
  .put(protect, toggleVacationMode);

export default router;
