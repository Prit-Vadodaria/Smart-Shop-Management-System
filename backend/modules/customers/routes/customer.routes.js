import express from 'express';
import {
  getCustomerProfile,
  setupCustomerProfile,
  updateCustomerProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultDeliveryAddress,
  getCustomers,
  registerQuickCustomer
} from '../controllers/customer.controller.js';
import { protect, authorize, authorizeManager } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.route('/profile')
  .get(protect, getCustomerProfile)
  .put(protect, updateCustomerProfile)
  .post(protect, setupCustomerProfile);

router.route('/address')
  .post(protect, addAddress);

router.route('/address/:addressId')
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

router.put('/address/:addressId/default-delivery', protect, setDefaultDeliveryAddress);

router.route('/quick-customer')
  .post(protect, authorizeManager, registerQuickCustomer);

router.route('/')
  .get(protect, authorize('admin', 'employee'), getCustomers);

export default router;
