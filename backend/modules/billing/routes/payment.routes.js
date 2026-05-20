import express from 'express';
import {
  processPayment,
  getPayments
} from '../controllers/payment.controller.js';
import { protect, authorize } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin'), getPayments)
  .post(protect, processPayment);

export default router;
