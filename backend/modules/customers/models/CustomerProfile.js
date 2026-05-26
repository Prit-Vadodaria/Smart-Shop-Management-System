import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema({
  tag: { type: String, enum: ['Home', 'Office', 'Other'], default: 'Home' },
  fullName: { type: String },
  phoneNumber: { type: String },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  landmark: { type: String },
  isDefaultDelivery: { type: Boolean, default: false }
});

const CustomerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  customerId: {
    type: String,
    unique: true,
    required: true
  },
  phone: {
    type: String,
    required: true,
    match: [/^(?:\d{10}|Not provided)$/, 'Please add a valid 10-digit phone number or "Not provided"']
  },
  addresses: [AddressSchema],
  walletBalance: {
    type: Number,
    default: 0
  },
  totalAmountSpent: {
    type: Number,
    default: 0
  },
  preferences: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

export default mongoose.model('CustomerProfile', CustomerProfileSchema);
