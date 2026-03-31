import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  shopName: { type: String, default: 'My Shop' },
  taxRate: { type: Number, default: 5 },
  subscriptionCutOffTime: { type: String, default: '20:00' }, // 8 PM
  deliveryRadiusKm: { type: Number, default: 5 },
  minimumOrderValue: { type: Number, default: 100 },
  currency: { type: String, default: 'INR' },
  logoUrl: { type: String }
}, {
  timestamps: true
});

export default mongoose.model('Settings', SettingsSchema);
