import Subscription from '../models/Subscription.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import CustomerProfile from '../models/CustomerProfile.js';

// @desc    Create new subscription
// @route   POST /api/subscriptions
// @access  Private
export const createSubscription = async (req, res, next) => {
  try {
    const { product, quantity, frequency, customDays, startDate, endDate } = req.body;

    const prod = await Product.findById(product);

    if (!prod) {
      res.status(404);
      throw new Error('Product not found');
    }

    if (!prod.isSubscriptionEligible) {
      res.status(400);
      throw new Error('Product is not eligible for subscription');
    }

    if (quantity < prod.minSubscriptionQuantity) {
      res.status(400);
      throw new Error(`Minimum subscription quantity is ${prod.minSubscriptionQuantity}`);
    }

    const subscription = new Subscription({
      customer: req.user._id,
      product,
      quantity,
      frequency,
      customDays,
      startDate,
      endDate
    });

    const createdSubscription = await subscription.save();
    res.status(201).json(createdSubscription);
  } catch (error) {
    next(error);
  }
};

// @desc    Create bulk subscriptions
// @route   POST /api/subscriptions/bulk
// @access  Private
export const createBulkSubscriptions = async (req, res, next) => {
    try {
        const { items, frequency, customDays, startDate, endDate } = req.body;

        if (!items || items.length === 0) {
            res.status(400);
            throw new Error('No items provided for subscription');
        }

        const subscriptions = [];
        for (const item of items) {
            const prod = await Product.findById(item.product);
            if (!prod) continue;
            if (!prod.isSubscriptionEligible) continue;

            const subscription = new Subscription({
                customer: req.user._id,
                product: item.product,
                quantity: item.quantity || prod.minSubscriptionQuantity || 1,
                frequency,
                customDays,
                startDate,
                endDate
            });
            subscriptions.push(await subscription.save());
        }

        res.status(201).json(subscriptions);
    } catch (error) {
        next(error);
    }
};

// @desc    Get logged in user subscriptions
// @route   GET /api/subscriptions/my-subscriptions
// @access  Private
export const getMySubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ customer: req.user._id }).populate('product');
    res.json(subscriptions);
  } catch (error) {
    next(error);
  }
};

// @desc    Update subscription status (pause/resume/cancel)
// @route   PUT /api/subscriptions/:id/status
// @access  Private
export const updateSubscriptionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      res.status(404);
      throw new Error('Subscription not found');
    }

    // Checking if user owns it or if they are admin
    if (subscription.customer.toString() !== req.user._id.toString() && req.user.role === 'Customer') {
       res.status(403);
       throw new Error('Not authorized to update this subscription');
    }

    subscription.status = status;
    const updatedSubscription = await subscription.save();

    res.json(updatedSubscription);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Vacation Mode
// @route   PUT /api/subscriptions/:id/vacation
// @access  Private
export const toggleVacationMode = async (req, res, next) => {
    try {
        const { isOn, startDate, endDate } = req.body;
        const subscription = await Subscription.findById(req.params.id);
        
        if (!subscription) {
            res.status(404);
            throw new Error('Subscription not found');
        }

        if (subscription.customer.toString() !== req.user._id.toString() && req.user.role === 'Customer') {
            res.status(403);
            throw new Error('Not authorized');
        }

        subscription.vacationMode = { isOn, startDate, endDate };
        await subscription.save();

        res.json({ success: true, vacationMode: subscription.vacationMode });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all active subscriptions (for admin to generate daily orders)
// @route   GET /api/subscriptions/active
// @access  Private/Admin/Manager
export const getActiveSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ status: 'Active' }).populate('customer').populate('product');
    res.json(subscriptions);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all subscriptions (for admin to manage)
// @route   GET /api/subscriptions
// @access  Private/Admin/Manager
export const getAllSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find().sort('-createdAt').populate('customer').populate('product');
    res.json(subscriptions);
  } catch (error) {
    next(error);
  }
};

// @desc    Automatically generate orders for today from active subscriptions
// @route   POST /api/subscriptions/generate-orders
// @access  Private/Admin/Manager
export const generateDailyOrders = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayName = dayNames[today.getDay()];

        const activeSubscriptions = await Subscription.find({ status: 'Active' })
            .populate('product')
            .populate('customer');

        let createdOrdersCount = 0;
        let skippedSubscriptionsCount = 0;
        let errorCount = 0;

        // 1. Identify which subscriptions are due today
        const dueSubscriptions = [];

        for (const sub of activeSubscriptions) {
            try {
                if (!sub.customer || !sub.product) {
                    skippedSubscriptionsCount++;
                    continue;
                }

                const startDate = new Date(sub.startDate);
                startDate.setHours(0, 0, 0, 0);

                if (today < startDate) continue;

                if (sub.vacationMode && sub.vacationMode.isOn) {
                    const vStart = new Date(sub.vacationMode.startDate);
                    const vEnd = new Date(sub.vacationMode.endDate);
                    if (today >= vStart && today <= vEnd) {
                        skippedSubscriptionsCount++;
                        continue;
                    }
                }

                let isDue = false;
                if (sub.frequency === 'Daily') isDue = true;
                else if (sub.frequency === 'Alternate days') {
                    const diffTime = Math.abs(today - startDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays % 2 === 0) isDue = true;
                } else if (sub.frequency === 'Custom days') {
                    if (sub.customDays.includes(currentDayName)) isDue = true;
                }

                if (!isDue) continue;

                // Check if this specific subscription already has an order generated for today
                const alreadyGenerated = await Order.findOne({
                    subscription: sub._id,
                    createdAt: { $gte: today }
                });
                if (alreadyGenerated) continue;

                dueSubscriptions.push(sub);
            } catch (err) {
                console.error('Error processing sub during due-check:', err);
                errorCount++;
            }
        }

        // 2. Group due subscriptions by customer
        const groupsByCustomer = {};
        dueSubscriptions.forEach(sub => {
            const cid = sub.customer._id.toString();
            if (!groupsByCustomer[cid]) groupsByCustomer[cid] = [];
            groupsByCustomer[cid].push(sub);
        });

        // 3. Create one Order per customer
        const customerIds = Object.keys(groupsByCustomer);
        for (const cid of customerIds) {
            try {
                const subs = groupsByCustomer[cid];
                const profile = await CustomerProfile.findOne({ user: cid });
                const defaultAddr = profile ? profile.addresses.find(a => a.isDefaultDelivery) || profile.addresses[0] : null;

                let itemsPrice = 0;
                let taxPrice = 0;
                const orderItems = [];

                subs.forEach(s => {
                    const price = s.quantity * s.product.price;
                    const tax = price * (s.product.taxPercentage / 100);
                    
                    itemsPrice += price;
                    taxPrice += tax;

                    orderItems.push({
                        name: s.product.name,
                        quantity: s.quantity,
                        image: s.product.image,
                        price: s.product.price,
                        product: s.product._id
                    });
                });

                const order = new Order({
                    customer: cid,
                    // Link to the first subscription to maintain single-order ref compatibility
                    subscription: subs[0]._id, 
                    orderItems,
                    itemsPrice,
                    taxPrice,
                    shippingPrice: 0,
                    totalPrice: itemsPrice + taxPrice,
                    shippingAddress: {
                        address: defaultAddr ? `${defaultAddr.addressLine1}, ${defaultAddr.addressLine2 || ''}` : 'No address specified',
                        city: defaultAddr ? defaultAddr.city : 'N/A',
                        postalCode: defaultAddr ? defaultAddr.pincode : '000000',
                        country: 'India'
                    },
                    orderType: 'Home Delivery',
                    paymentMethod: 'Cash',
                    isPaid: false,
                    status: 'Pending'
                });

                await order.save();
                createdOrdersCount++;
            } catch (orderErr) {
                console.error(`Error generating consolidated order:`, orderErr);
                errorCount++;
            }
        }

        res.json({
            success: true,
            createdOrdersCount,
            totalSubscriptionsProcessed: dueSubscriptions.length,
            message: `Generated ${createdOrdersCount} consolidated orders for ${dueSubscriptions.length} subscriptions.`
        });
    } catch (err) {
        next(err);
    }
};
