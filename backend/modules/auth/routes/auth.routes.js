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
  updateEmployeePosition,
  getPasswordRules,
  forgotPassword,
  resetPassword,
  changePassword,
  validatePasswordEndpoint,
  getEmployeeProfile,
  updateEmployeeProfile,
  updateEmployeeEmail,
  updateEmployeeRole
} from '../controllers/auth.controller.js';
import { protect, authorize, authorizeManager } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/password-rules', getPasswordRules);
router.post('/validate-password', validatePasswordEndpoint);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

router.get('/me', protect, getMe);
router.route('/profile')
  .get(protect, authorize('admin', 'employee'), getEmployeeProfile)
  .put(protect, authorize('admin', 'employee'), updateEmployeeProfile);
router.put('/change-password', protect, changePassword);
router.get('/staff', protect, authorizeManager, getStaff);

router.route('/employees')
  .post(protect, authorize('admin'), createEmployee)
  .get(protect, authorize('admin'), getEmployees);

router.put('/employees/:id/reset-password', protect, authorize('admin'), resetEmployeePassword);
router.put('/employees/:id/status', protect, authorize('admin'), updateEmployeeStatus);
router.put('/employees/:id/position', protect, authorize('admin'), updateEmployeePosition);
router.put('/employees/:id/email', protect, authorize('admin'), updateEmployeeEmail);
router.put('/employees/:id/role', protect, authorize('admin'), updateEmployeeRole);

export default router;
