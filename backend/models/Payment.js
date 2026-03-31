import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  subscriptionBillId: {
    type: mongoose.Schema.Types.ObjectId, // Reference if there's a separate MonthlyBill schema
    ref: 'MonthlyBill'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Staff who processed POS payment
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Cash + UPI', 'Wallet'],
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
    enum: ['Success', 'Failed', 'Pending'],
    default: 'Success'
  },
  paymentContext: {
    type: String,
    enum: ['POS', 'Portal Order', 'Subscription Bill'],
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Payment', PaymentSchema);
