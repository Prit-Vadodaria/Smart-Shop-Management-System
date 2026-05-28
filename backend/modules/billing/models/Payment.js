import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  subscriptionBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MonthlyBill'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Cash + UPI', 'Wallet', 'Online', 'Cash on Delivery'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  cashAmount: { type: Number, default: 0 },
  upiAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Success', 'Failed', 'Pending', 'Cancelled'],
    default: 'Success'
  },
  paymentContext: {
    type: String,
    enum: ['POS', 'Portal Order', 'Subscription Bill'],
    required: true
  },
  paidAt: {
    type: Date
  },
  remarks: {
    type: String
  }
}, {
  timestamps: true
});

PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ customer: 1, createdAt: -1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ paymentContext: 1 });

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
