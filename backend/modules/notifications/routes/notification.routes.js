import express from 'express';
import { getMyNotifications, markAsRead } from '../controllers/notification.controller.js';
import { protect } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMyNotifications);
router.put('/:id/read', protect, markAsRead);

export default router;
