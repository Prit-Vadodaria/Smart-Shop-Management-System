import express from 'express';
import {
  getAdminCustomers,
  getAdminCustomerDetails,
  updateCustomerStatus
} from '../controllers/admin.customer.controller.js';
import { protect, authorize } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin'), getAdminCustomers);

router.route('/:id')
  .get(protect, authorize('admin'), getAdminCustomerDetails);

router.route('/:id/status')
  .put(protect, authorize('admin'), updateCustomerStatus);

export default router;
