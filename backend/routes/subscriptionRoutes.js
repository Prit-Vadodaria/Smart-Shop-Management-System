import express from 'express';
import {
  getMySubscriptionLists,
  updateSubscriptionListItems,
  updateSubscriptionListSettings,
  getActiveSubscriptions,
  getAllSubscriptions,
  generateDailyOrders
} from '../controllers/subscriptionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('Admin', 'Manager'), getAllSubscriptions);

router.route('/active')
  .get(protect, authorize('Admin', 'Manager'), getActiveSubscriptions);

router.route('/generate-orders')
  .post(protect, authorize('Admin', 'Manager'), generateDailyOrders);

router.route('/my-lists')
  .get(protect, getMySubscriptionLists);

router.route('/:id/items')
  .put(protect, updateSubscriptionListItems);

router.route('/:id/settings')
  .put(protect, updateSubscriptionListSettings);

export default router;
