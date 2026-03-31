import express from 'express';
import {
  createSubscription,
  getMySubscriptions,
  updateSubscriptionStatus,
  toggleVacationMode,
  getActiveSubscriptions
} from '../controllers/subscriptionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createSubscription)
  .get(protect, authorize('Admin', 'Manager'), getActiveSubscriptions);

router.route('/my-subscriptions')
  .get(protect, getMySubscriptions);

router.route('/:id/status')
  .put(protect, updateSubscriptionStatus);

router.route('/:id/vacation')
  .put(protect, toggleVacationMode);

export default router;
