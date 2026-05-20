import express from 'express';
import { 
  register, 
  login, 
  getMe, 
  getStaff,
  createEmployee,
  getEmployees,
  resetEmployeePassword,
  updateEmployeeStatus,
  updateEmployeePosition
} from '../controllers/auth.controller.js';
import { protect, authorize, authorizeManager } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/staff', protect, authorizeManager, getStaff);

// Employee Management routes (Admin Only)
router.route('/employees')
  .post(protect, authorize('admin'), createEmployee)
  .get(protect, authorize('admin'), getEmployees);

router.put('/employees/:id/reset-password', protect, authorize('admin'), resetEmployeePassword);
router.put('/employees/:id/status', protect, authorize('admin'), updateEmployeeStatus);
router.put('/employees/:id/position', protect, authorize('admin'), updateEmployeePosition);

export default router;
