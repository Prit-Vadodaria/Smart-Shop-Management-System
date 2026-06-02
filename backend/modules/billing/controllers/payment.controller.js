import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import {
  createPOSPayment,
  createPortalPayment,
  syncOrderPaymentState
} from '../services/payment.service.js';

// @desc    Process a new payment manually
// @route   POST /api/payments
// @access  Private (Staff/Admin for POS, Customer for Portal)
export const processPayment = async (req, res, next) => {
  try {
    const { orderId, amount, paymentMode, transactionId, cashAmount, upiAmount, paymentContext, customerId } = req.body;

    let payment;
    if (paymentContext === 'POS') {
      payment = await createPOSPayment({
        orderId,
        staffId: req.user._id,
        paymentMode,
        amount,
        cashAmount,
        upiAmount,
        customerId
      });
    } else {
      payment = await createPortalPayment({
        orderId,
        customerId: req.user.role === 'customer' ? req.user._id : customerId,
        paymentMode,
        amount,
        transactionId,
        paymentContext
      });
    }

    // Sync corresponding order if present
    if (orderId) {
      const order = await Order.findById(orderId);
      if (order) {
        await syncOrderPaymentState(order);
      }
    }

    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
};

// @desc    Get payments with pagination and filtering
// @route   GET /api/payments
// @access  Private/Admin/Manager
export const getPayments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentMode,
      paymentContext,
      customer,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (paymentMode) query.paymentMode = paymentMode;
    if (paymentContext) query.paymentContext = paymentContext;
    if (customer) query.customer = customer;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('staff', 'name email')
      .populate('customer', 'name email')
      .populate('orderId', 'totalPrice status');

    res.json({
      success: true,
      data: payments,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      total
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment summary / dashboard reporting
// @route   GET /api/payments/summary
// @access  Private/Admin/Manager
export const getPaymentSummary = async (req, res, next) => {
  try {
    // 1. Total Revenue (Successful payments)
    const revenueRes = await Payment.aggregate([
      { $match: { status: 'Success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // 2. Pending COD Amount
    const pendingCODRes = await Payment.aggregate([
      { $match: { status: 'Pending', paymentMode: 'Cash on Delivery' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // 3. Failed Payments Info
    const failedRes = await Payment.aggregate([
      { $match: { status: 'Failed' } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]);

    // 4. Payment Mode Breakdowns
    const modeTotalsRes = await Payment.aggregate([
      { $group: { _id: '$paymentMode', total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      totalRevenue: revenueRes[0]?.total || 0,
      pendingCOD: pendingCODRes[0]?.total || 0,
      failedPayments: {
        count: failedRes[0]?.count || 0,
        totalAmount: failedRes[0]?.total || 0
      },
      paymentModeTotals: modeTotalsRes.map(item => ({
        paymentMode: item._id,
        total: item.total
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending subscription amount for current customer
// @route   GET /api/payments/subscription/pending
// @access  Private/Customer
export const getPendingSubscriptionAmount = async (req, res, next) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ success: false, message: 'Only customers can access subscription pending amount.' });
    }

    const pendingOrders = await Order.find({
      customer: req.user._id,
      orderChannel: 'Subscription Order',
      isPaid: false,
      status: { $ne: 'Cancelled' }
    }).select('_id totalPrice createdAt');

    const pendingAmount = pendingOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    res.json({
      success: true,
      pendingAmount,
      pendingOrdersCount: pendingOrders.length,
      orderIds: pendingOrders.map((o) => o._id)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Pay all pending subscription-tagged orders for current customer
// @route   POST /api/payments/subscription/pay
// @access  Private/Customer
export const payPendingSubscriptionOrders = async (req, res, next) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ success: false, message: 'Only customers can pay subscription pending orders.' });
    }

    const pendingOrders = await Order.find({
      customer: req.user._id,
      orderChannel: 'Subscription Order',
      isPaid: false,
      status: { $ne: 'Cancelled' }
    });

    if (pendingOrders.length === 0) {
      return res.status(400).json({ success: false, message: 'No pending subscription orders to pay.' });
    }

    const baseTransactionId = req.body?.transactionId || `SUB-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const paymentMode = 'Online';

    for (let i = 0; i < pendingOrders.length; i += 1) {
      const order = pendingOrders[i];
      const orderTransactionId = `${baseTransactionId}-${i + 1}`;

      await createPortalPayment({
        orderId: order._id,
        customerId: req.user._id,
        paymentMode,
        amount: order.totalPrice,
        transactionId: orderTransactionId,
        paymentContext: 'Subscription Bill'
      });

      await syncOrderPaymentState(order);
    }

    const totalPaidAmount = pendingOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    res.status(201).json({
      success: true,
      message: 'Subscription pending amount paid successfully.',
      paidOrdersCount: pendingOrders.length,
      totalPaidAmount
    });
  } catch (error) {
    next(error);
  }
};
