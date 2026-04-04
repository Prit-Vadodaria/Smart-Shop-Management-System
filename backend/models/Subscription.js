import mongoose from 'mongoose';

const SubscriptionItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const SubscriptionSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['Daily', 'Alternate', 'Monthly'],
    required: true
  },
  items: [SubscriptionItemSchema],
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  // Used for 'Monthly' type - days of the month (1-31)
  customDates: {
    type: [Number],
    default: []
  },
  status: {
    type: String,
    enum: ['Active', 'Paused', 'Cancelled'],
    default: 'Active'
  },
  vacationMode: {
    isOn: { type: Boolean, default: false },
    startDate: { type: Date },
    endDate: { type: Date }
  }
}, {
  timestamps: true
});

// A customer can only have one list per type
SubscriptionSchema.index({ customer: 1, type: 1 }, { unique: true });

export default mongoose.model('Subscription', SubscriptionSchema);
