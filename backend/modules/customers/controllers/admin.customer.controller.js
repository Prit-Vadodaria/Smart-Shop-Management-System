import User from '../../auth/models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import Order from '../../billing/models/Order.js';
import Subscription from '../../subscriptions/models/Subscription.js';
import Payment from '../../billing/models/Payment.js';

// @desc    Get all customers with aggregate details (Admin/Manager)
// @route   GET /api/admin/customers
// @access  Private/Admin/Manager
export const getAdminCustomers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Base pipeline to find all users with role 'customer'
    const pipeline = [
      { $match: { role: 'customer' } },
      {
        $lookup: {
          from: 'customerprofiles',
          localField: '_id',
          foreignField: 'user',
          as: 'profile'
        }
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      
      // Match by search (name, email, phone)
      ...(search ? [{
        $match: {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { 'profile.phone': { $regex: search, $options: 'i' } }
          ]
        }
      }] : []),

      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'customer',
          as: 'orders'
        }
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'customer',
          as: 'subscriptions'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          createdAt: 1,
          customerId: { $ifNull: ['$profile.customerId', 'N/A'] },
          phone: { $ifNull: ['$profile.phone', 'Not provided'] },
          walletBalance: { $ifNull: ['$profile.walletBalance', 0] },
          totalSpent: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$orders',
                    as: 'order',
                    cond: { $ne: ['$$order.status', 'Cancelled'] }
                  }
                },
                as: 'o',
                in: '$$o.totalPrice'
              }
            }
          },
          totalOrders: {
            $size: {
              $filter: {
                input: '$orders',
                as: 'order',
                cond: { $ne: ['$$order.status', 'Cancelled'] }
              }
            }
          },
          activeSubscription: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: '$subscriptions',
                    as: 'sub',
                    cond: { $eq: ['$$sub.status', 'Active'] }
                  }
                }
              },
              0
            ]
          },
          status: {
            $cond: {
              if: { $eq: ['$profile.phone', 'Suspended'] },
              then: 'Inactive',
              else: 'Active'
            }
          }
        }
      }
    ];

    // Compute total count
    const totalPipeline = [...pipeline, { $count: 'count' }];
    const totalRes = await User.aggregate(totalPipeline);
    const total = totalRes[0]?.count || 0;

    // Sorting
    const sortField = sortBy === 'joinedOn' || sortBy === 'createdAt' ? 'createdAt' : sortBy;
    const sortMultiplier = sortOrder === 'desc' ? -1 : 1;
    pipeline.push({ $sort: { [sortField]: sortMultiplier } });

    // Pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNum });

    const customers = await User.aggregate(pipeline);

    res.json({
      success: true,
      data: customers,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      total
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single customer detailed profile (Admin/Manager)
// @route   GET /api/admin/customers/:id
// @access  Private/Admin/Manager
export const getAdminCustomerDetails = async (req, res, next) => {
  try {
    const customerId = req.params.id;

    // 1. Fetch user & profile
    const user = await User.findById(customerId).select('-password');
    if (!user || user.role !== 'customer') {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    let profile = await CustomerProfile.findOne({ user: customerId });
    if (!profile) {
      profile = await CustomerProfile.create({
        user: customerId,
        customerId: `CUST${Date.now()}`,
        phone: 'Not provided',
        addresses: []
      });
    }

    // 2. Fetch all orders (excluding cancelled for analytics, but include in list)
    const orders = await Order.find({ customer: customerId }).sort({ createdAt: -1 });
    const nonCancelledOrders = orders.filter(o => o.status !== 'Cancelled');

    // 3. Fetch subscriptions
    const subscriptions = await Subscription.find({ customer: customerId })
      .populate('items.product', 'name price image');

    // 4. Fetch payments
    const payments = await Payment.find({ customer: customerId }).sort({ createdAt: -1 });

    // 5. Compute Analytics
    const totalSpent = nonCancelledOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const totalOrders = nonCancelledOrders.length;
    const activeSubsCount = subscriptions.filter(s => s.status === 'Active').length;

    // Pending Subscription Amount (Unpaid subscription orders)
    const pendingSubOrders = orders.filter(o => o.orderChannel === 'Subscription Order' && !o.isPaid && o.status !== 'Cancelled');
    const pendingSubscriptionAmount = pendingSubOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    const averageOrderValue = totalOrders > 0 ? (totalSpent / totalOrders) : 0;
    const lastOrderDate = orders.length > 0 ? orders[0].createdAt : null;

    const analytics = {
      totalSpent,
      totalOrders,
      activeSubscriptions: activeSubsCount,
      pendingSubscriptionAmount,
      averageOrderValue,
      lastOrderDate
    };

    // 6. Recent Orders (Top 10)
    const recentOrders = orders.slice(0, 10);

    // 7. Pending Payments Overview (Unpaid orders of all types, highlight subscription orders)
    const pendingPayments = orders
      .filter(o => !o.isPaid && o.status !== 'Cancelled')
      .map(o => ({
        orderId: o._id,
        amount: o.totalPrice,
        dueDate: o.createdAt, // Assumed due at creation
        status: o.status,
        orderChannel: o.orderChannel || 'Regular',
        paymentMethod: o.paymentMethod
      }));

    // 8. Generate Activity Timeline
    const activity = [];

    // Add Account Creation
    activity.push({
      type: 'account_created',
      title: 'Account Created',
      description: 'Customer registered an account on the store.',
      timestamp: user.createdAt
    });

    // Add Subscription events
    subscriptions.forEach(sub => {
      activity.push({
        type: 'subscription_created',
        title: `${sub.type} Subscription Started`,
        description: `Started subscription with ${sub.items.length} items.`,
        timestamp: sub.createdAt
      });
    });

    // Add Payments events
    payments.forEach(pay => {
      if (pay.status === 'Success') {
        activity.push({
          type: 'payment_made',
          title: 'Payment Received',
          description: `Paid ₹${pay.amount} via ${pay.paymentMode} for ${pay.paymentContext}.`,
          timestamp: pay.createdAt
        });
      }
    });

    // Add Orders events
    orders.forEach(order => {
      activity.push({
        type: 'order_placed',
        title: 'Order Placed',
        description: `Placed order #${order._id.toString().substring(order._id.toString().length - 8).toUpperCase()} for ₹${order.totalPrice} (${order.orderChannel || 'Regular'}).`,
        timestamp: order.createdAt
      });
    });

    // Sort timeline by timestamp desc
    activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: {
        customer: {
          _id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          customerId: profile.customerId,
          phone: profile.phone,
          addresses: profile.addresses,
          walletBalance: profile.walletBalance,
          isActive: user.isActive
        },
        analytics,
        subscriptions,
        recentOrders,
        pendingPayments,
        activity: activity.slice(0, 15) // Top 15 activities
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate/Activate customer (Admin/Manager)
// @route   PUT /api/admin/customers/:id/status
// @access  Private/Admin/Manager
export const updateCustomerStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean.' });
    }

    const customer = await User.findById(req.params.id);
    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.isActive = isActive;
    await customer.save();

    res.status(200).json({ 
      success: true, 
      message: `Customer account status updated successfully to: ${isActive ? 'Active' : 'Inactive'}`,
      data: {
        id: customer._id,
        isActive: customer.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};
