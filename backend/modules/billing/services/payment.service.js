import Payment from '../models/Payment.js';
import Order from '../models/Order.js';

/**
 * Create a payment record for POS sales (defaults to Success/POS context).
 */
export const createPOSPayment = async ({
  orderId,
  staffId,
  paymentMode,
  amount,
  cashAmount = 0,
  upiAmount = 0,
  customerId = null
}, session = null) => {
  const options = session ? { session } : {};

  // Split payment validation
  if (paymentMode === 'Cash + UPI') {
    if ((cashAmount + upiAmount) !== amount) {
      throw new Error('Cash amount and UPI amount must equal the total amount');
    }
  }

  const payment = new Payment({
    orderId,
    staff: staffId,
    customer: customerId,
    paymentMode,
    amount,
    cashAmount,
    upiAmount,
    status: 'Success',
    paymentContext: 'POS',
    paidAt: new Date(),
    remarks: 'POS Checkout completed successfully'
  });

  await payment.save(options);
  return payment;
};

/**
 * Create a payment record for Portal customer orders.
 */
export const createPortalPayment = async ({
  orderId,
  customerId,
  paymentMode,
  amount,
  transactionId = null,
  paymentContext = 'Portal Order'
}, session = null) => {
  const options = session ? { session } : {};

  if (paymentMode === 'Online') {
    if (!transactionId) {
      throw new Error('Transaction ID is required for online payments');
    }
    // Prevent duplicate transactionId
    const existingPayment = await Payment.findOne({ transactionId }, null, options);
    if (existingPayment) {
      throw new Error('Duplicate transaction ID');
    }
  }

  const status = paymentMode === 'Online' ? 'Success' : 'Pending';
  const paidAt = paymentMode === 'Online' ? new Date() : undefined;

  const payment = new Payment({
    orderId,
    customer: customerId,
    paymentMode,
    amount,
    transactionId: paymentMode === 'Online' ? transactionId : undefined,
    status,
    paymentContext,
    paidAt,
    remarks: paymentMode === 'Online' ? 'Online payment successful' : 'Cash on Delivery pending'
  });

  await payment.save(options);
  return payment;
};

/**
 * Mark a pending payment as successful (e.g. upon delivery).
 */
export const markPaymentSuccess = async (orderId, session = null) => {
  const options = session ? { session } : {};
  const payment = await Payment.findOne({ orderId }, null, options);
  if (payment) {
    payment.status = 'Success';
    payment.paidAt = new Date();
    await payment.save(options);
  }
};

/**
 * Mark a pending payment as cancelled.
 */
export const markPaymentCancelled = async (orderId, session = null) => {
  const options = session ? { session } : {};
  const payment = await Payment.findOne({ orderId }, null, options);
  if (payment) {
    payment.status = 'Cancelled';
    await payment.save(options);
  }
};

/**
 * Keep Order.isPaid and Order.paidAt synchronized with the Payment status.
 */
export const syncOrderPaymentState = async (order, session = null) => {
  const options = session ? { session } : {};
  const payment = await Payment.findOne({ orderId: order._id }, null, options);
  if (payment) {
    if (payment.status === 'Success') {
      order.isPaid = true;
      order.paidAt = payment.paidAt || new Date();
    } else if (payment.status === 'Cancelled') {
      order.isPaid = false;
      order.paidAt = undefined;
    } else {
      order.isPaid = false;
      order.paidAt = undefined;
    }
    await order.save(options);
  }
};
