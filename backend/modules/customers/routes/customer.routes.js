import express from 'express';
import {
  getCustomerProfile,
  setupCustomerProfile,
  addAddress,
  getCustomers,
  registerQuickCustomer
} from '../controllers/customer.controller.js';
import { protect, authorize } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.route('/profile')
  .get(protect, getCustomerProfile)
  .post(protect, setupCustomerProfile);

router.route('/address')
  .post(protect, addAddress);

router.route('/quick-customer')
  .post(protect, authorize('Admin', 'Manager'), registerQuickCustomer);

router.route('/')
  .get(protect, authorize('Admin', 'Manager'), getCustomers);

export default router;
