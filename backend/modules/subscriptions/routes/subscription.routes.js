import express from 'express';
import {
  getMySubscriptionLists,
  updateSubscriptionListItems,
  updateSubscriptionListSettings,
  getActiveSubscriptions,
  getAllSubscriptions,
  generateDailyOrders
} from '../controllers/subscription.controller.js';
import { protect, authorizeManager } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorizeManager, getAllSubscriptions);

router.route('/active')
  .get(protect, authorizeManager, getActiveSubscriptions);

router.route('/generate-orders')
  .post(protect, authorizeManager, generateDailyOrders);

router.route('/my-lists')
  .get(protect, getMySubscriptionLists);

router.route('/:id/items')
  .put(protect, updateSubscriptionListItems);

router.route('/:id/settings')
  .put(protect, updateSubscriptionListSettings);

export default router;
