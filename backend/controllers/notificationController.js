import Notification from '../models/Notification.js';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getMyNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ user: req.user._id }).sort('-createdAt').limit(20);
        res.json(notifications);
    } catch (error) {
        next(error);
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (notification) {
            if (notification.user.toString() !== req.user._id.toString()) {
                res.status(401);
                throw new Error('Not authorized');
            }
            notification.isRead = true;
            await notification.save();
            res.json({ message: 'Notification marked as read' });
        } else {
            res.status(404);
            throw new Error('Notification not found');
        }
    } catch (error) {
        next(error);
    }
};
