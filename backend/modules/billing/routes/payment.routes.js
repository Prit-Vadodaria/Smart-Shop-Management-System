import express from 'express';
import {
  processPayment,
  getPayments,
  getPaymentSummary,
  getPendingSubscriptionAmount,
  payPendingSubscriptionOrders
} from '../controllers/payment.controller.js';
import { protect, authorizeManager } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.route('/summary')
  .get(protect, authorizeManager, getPaymentSummary);

router.route('/subscription/pending')
  .get(protect, getPendingSubscriptionAmount);

router.route('/subscription/pay')
  .post(protect, payPendingSubscriptionOrders);

router.route('/')
  .get(protect, authorizeManager, getPayments)
  .post(protect, processPayment);

export default router;
