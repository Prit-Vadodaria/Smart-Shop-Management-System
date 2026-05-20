import express from 'express';
import {
  getCustomerProfile,
  setupCustomerProfile,
  addAddress,
  getCustomers,
  registerQuickCustomer
} from '../controllers/customer.controller.js';
import { protect, authorize, authorizeManager } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.route('/profile')
  .get(protect, getCustomerProfile)
  .post(protect, setupCustomerProfile);

router.route('/address')
  .post(protect, addAddress);

router.route('/quick-customer')
  .post(protect, authorizeManager, registerQuickCustomer);

router.route('/')
  .get(protect, authorize('admin', 'employee'), getCustomers);

export default router;
