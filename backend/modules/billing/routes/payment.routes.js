import express from 'express';
import {
  processPayment,
  getPayments,
  getPaymentSummary
} from '../controllers/payment.controller.js';
import { protect, authorizeManager } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.route('/summary')
  .get(protect, authorizeManager, getPaymentSummary);



router.route('/')
  .get(protect, authorizeManager, getPayments)
  .post(protect, processPayment);

export default router;
