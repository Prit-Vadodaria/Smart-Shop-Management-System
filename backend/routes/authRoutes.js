import express from 'express';
import { register, login, getMe, getStaff } from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/staff', protect, authorize('Admin', 'Manager'), getStaff);

export default router;
