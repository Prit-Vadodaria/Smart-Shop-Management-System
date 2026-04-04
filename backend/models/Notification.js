import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Order Assigned', 'Alert', 'System'],
    default: 'Order Assigned'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedId: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('Notification', NotificationSchema);
