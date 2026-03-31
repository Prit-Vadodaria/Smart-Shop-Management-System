import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  frequency: {
    type: String,
    enum: ['Daily', 'Alternate days', 'Custom days'],
    required: true
  },
  customDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }], // Used only if frequency is 'Custom days'
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Active', 'Paused', 'Cancelled'],
    default: 'Active'
  },
  skippedDates: [{
    type: Date
  }],
  vacationMode: {
    isOn: { type: Boolean, default: false },
    startDate: { type: Date },
    endDate: { type: Date }
  }
}, {
  timestamps: true
});

export default mongoose.model('Subscription', SubscriptionSchema);
