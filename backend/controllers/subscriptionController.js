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

        let createdCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const sub of activeSubscriptions) {
            try {
                // Safety Check: Avoid crashing if customer or product reference is broken
                if (!sub.customer || !sub.product) {
                    console.warn(`Skipping subscription ${sub._id} due to missing customer or product reference.`);
                    skippedCount++;
                    continue;
                }

            // 1. Basic vacation check
            if (sub.vacationMode && sub.vacationMode.isOn) {
                const start = new Date(sub.vacationMode.startDate);
                const end = new Date(sub.vacationMode.endDate);
                if (today >= start && today <= end) {
                    skippedCount++;
                    continue;
                }
            }

            // 2. Frequency logic
            let isDue = false;
            if (sub.frequency === 'Daily') {
                isDue = true;
            } else if (sub.frequency === 'Alternate days') {
                const startDate = new Date(sub.startDate);
                startDate.setHours(0,0,0,0);
                const diffTime = Math.abs(today - startDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays % 2 === 0) isDue = true;
            } else if (sub.frequency === 'Custom days') {
                if (sub.customDays.includes(currentDayName)) isDue = true;
            }

            if (!isDue) continue;

            // 3. Skip if already generated an order for this sub today
            const alreadyGenerated = await Order.findOne({
                subscription: sub._id,
                createdAt: { $gte: today }
            });
            if (alreadyGenerated) continue;

            // 4. Get default shipping address
            const profile = await CustomerProfile.findOne({ user: sub.customer._id });
            const defaultAddr = profile ? profile.addresses.find(a => a.isDefaultDelivery) || profile.addresses[0] : null;

            if (!defaultAddr) {
                console.warn(`No address found for customer ${sub.customer.name}, using placeholders.`);
            }

            const itemsPrice = sub.quantity * sub.product.price;
            const taxPrice = itemsPrice * (sub.product.taxPercentage / 100);
            const totalPrice = itemsPrice + taxPrice;

            const order = new Order({
                customer: sub.customer._id,
                subscription: sub._id,
                orderItems: [{
                    name: sub.product.name,
                    quantity: sub.quantity,
                    image: sub.product.image,
                    price: sub.product.price,
                    product: sub.product._id
                }],
                itemsPrice,
                taxPrice,
                shippingPrice: 0,
                totalPrice,
                shippingAddress: {
                    address: defaultAddr ? `${defaultAddr.addressLine1}, ${defaultAddr.addressLine2 || ''}` : 'No address specified',
                    city: defaultAddr ? defaultAddr.city : 'N/A',
                    postalCode: defaultAddr ? defaultAddr.pincode : '000000',
                    country: 'India'
                },
                orderType: 'Home Delivery',
                paymentMethod: 'Cash', // Default for subscription for simplicity, or "UPI"
                isPaid: false,
                status: 'Pending'
            });

                await order.save();
                createdCount++;
            } catch (loopErr) {
                console.error(`Error generating order for subscription ${sub._id}:`, loopErr);
                errorCount++;
            }
        }

        res.json({ 
            success: true, 
            createdCount, 
            skippedCount,
            errorCount,
            message: `System generated ${createdCount} orders for today's deliveries.` 
        });
    } catch (err) {
        next(err);
    }
};
