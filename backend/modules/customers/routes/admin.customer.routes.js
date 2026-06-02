import express from 'express';
import {
  getAdminCustomers,
  getAdminCustomerDetails,
  updateCustomerStatus
} from '../controllers/admin.customer.controller.js';
import { protect, authorize } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin', 'employee'), getAdminCustomers);

router.route('/:id')
  .get(protect, authorize('admin', 'employee'), getAdminCustomerDetails);

router.route('/:id/status')
  .put(protect, authorize('admin', 'employee'), updateCustomerStatus);

export default router;
