import express from 'express';
import {
  processPayment,
  getPayments
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('Admin', 'Manager'), getPayments)
  .post(protect, processPayment);

export default router;
