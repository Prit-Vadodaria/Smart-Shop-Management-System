import Payment from '../models/Payment.js';
import Order from '../models/Order.js';

// @desc    Process a new payment
// @route   POST /api/payments
// @access  Private (Staff/Admin for POS, Customer for Portal)
export const processPayment = async (req, res, next) => {
  try {
    const { orderId, amount, paymentMode, transactionId, cashAmount, upiAmount, paymentContext } = req.body;

    // Check if duplicate transactionId (for digital payments)
    if (transactionId) {
      const existingPayment = await Payment.findOne({ transactionId });
      if (existingPayment) {
        res.status(400);
        throw new Error('Duplicate transaction ID');
      }
    }

    const payment = new Payment({
      transactionId: transactionId || `CASH-${Date.now()}`,
      orderId,
      customer: req.user.role === 'Customer' ? req.user._id : req.body.customerId,
      staff: req.user.role !== 'Customer' ? req.user._id : null,
      paymentMode,
      amount,
      cashAmount,
      upiAmount,
      paymentContext
    });

    const createdPayment = await payment.save();

    // If linked to order, mark as paid
    if (orderId) {
       const order = await Order.findById(orderId);
       if (order) {
           order.isPaid = true;
           order.paidAt = Date.now();
           await order.save();
       }
    }

    res.status(201).json(createdPayment);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private/Admin/Manager
export const getPayments = async (req, res, next) => {
    try {
        const payments = await Payment.find({})
            .populate('staff', 'name email')
            .populate('customer', 'name email')
            .populate('orderId', 'totalPrice');
        res.json(payments);
    } catch (error) {
        next(error);
    }
};
