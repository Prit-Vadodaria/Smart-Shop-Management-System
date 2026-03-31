import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  id: {
    type: String,
    default: 'store-settings',
    unique: true
  },
  shippingPercentage: {
    type: Number,
    default: 5
  },
  freeShippingThreshold: {
    type: Number,
    default: 500
  }
}, {
  timestamps: true
});

export default mongoose.model('Settings', SettingsSchema);
