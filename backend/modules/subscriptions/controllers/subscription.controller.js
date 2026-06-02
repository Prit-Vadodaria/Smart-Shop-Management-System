import Subscription from '../models/Subscription.js';
import Product from '../../products/models/Product.js';
import Order from '../../billing/models/Order.js';
import CustomerProfile from '../../customers/models/CustomerProfile.js';

// @desc    Get user subscription lists (Daily, Alternate, Monthly)
// @route   GET /api/subscriptions/my-lists
// @access  Private
export const getMySubscriptionLists = async (req, res, next) => {
  try {
    const listTypes = ['Daily', 'Alternate', 'Monthly'];
    const lists = [];

    for (const type of listTypes) {
      let list = await Subscription.findOne({ customer: req.user._id, type })
        .populate('items.product');

      if (!list) {
        // Create an empty list if it doesn't exist
        list = await Subscription.create({
          customer: req.user._id,
          type,
          items: [],
          startDate: new Date()
        });
      }
      lists.push(list);
    }
    res.json(lists);
  } catch (error) {
    next(error);
  }
};

// @desc    Update items in a specific subscription list
// @route   PUT /api/subscriptions/:id/items
// @access  Private
export const updateSubscriptionListItems = async (req, res, next) => {
  try {
    const { items } = req.body; // Array of { product, quantity }
    const list = await Subscription.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ success: false, message: 'Subscription list not found' });
    }

    if (list.customer.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Fetch store settings for min subscription amount validation
    const Settings = (await import('../../settings/models/Settings.js')).default;
    const settings = await Settings.findOne({ id: 'store-settings' });
    const minSubscriptionAmount = settings ? settings.minSubscriptionAmount || 0 : 0;

    // Calculate total value of the items
    let totalVal = 0;
    if (items && items.length > 0) {
      for (const item of items) {
        const prod = await Product.findById(item.product);
        if (prod && prod.isActive && prod.isSubscriptionEligible) {
          totalVal += prod.price * item.quantity;
        }
      }
    }

    list.items = items;
    // When items are updated, if status was 'Action Required', reset to 'Active' if it qualifies
    if (list.status === 'Action Required') {
      if (items.length > 0 && totalVal < minSubscriptionAmount) {
        return res.status(400).json({ success: false, message: `Minimum subscription amount is ₹${minSubscriptionAmount}. Your current subscription total is ₹${totalVal.toFixed(2)}.` });
      }
      list.status = 'Active';
    } else if (list.status === 'Active' && items.length > 0 && totalVal < minSubscriptionAmount) {
      return res.status(400).json({ success: false, message: `Minimum subscription amount is ₹${minSubscriptionAmount}. Your current subscription total is ₹${totalVal.toFixed(2)}.` });
    }

    await list.save();
    
    // Refresh with populated product
    const updated = await Subscription.findById(list._id).populate('items.product');
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Update subscription list settings (status, dates, frequency)
// @route   PUT /api/subscriptions/:id/settings
// @access  Private
export const updateSubscriptionListSettings = async (req, res, next) => {
  try {
    const { status, startDate, customDates, vacationMode } = req.body;
    const list = await Subscription.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ success: false, message: 'Subscription list not found' });
    }

    const isOwner = list.customer.toString() === req.user._id.toString();
    const isManagerOrAdmin =
      req.user.role === 'admin' ||
      (req.user.role === 'employee' && req.user.employeeType === 'manager');
    if (!isOwner && !isManagerOrAdmin) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    if (status) {
      if (status === 'Active') {
        let totalVal = 0;
        if (list.items && list.items.length > 0) {
          for (const item of list.items) {
            const prod = await Product.findById(item.product);
            if (prod && prod.isActive && prod.isSubscriptionEligible) {
              totalVal += prod.price * item.quantity;
            }
          }
        }
        const Settings = (await import('../../settings/models/Settings.js')).default;
        const settings = await Settings.findOne({ id: 'store-settings' });
        const minSubscriptionAmount = settings ? settings.minSubscriptionAmount || 0 : 0;

        if (!list.items || list.items.length === 0) {
          return res.status(400).json({ success: false, message: 'Cannot start an empty subscription list.' });
        }
        if (totalVal < minSubscriptionAmount) {
          return res.status(400).json({ success: false, message: `Minimum subscription amount is ₹${minSubscriptionAmount}. Your current subscription total is ₹${totalVal.toFixed(2)}. Please add more items.` });
        }
      }
      list.status = status;
    }
    if (startDate) list.startDate = startDate;
    if (customDates) list.customDates = customDates;
    if (vacationMode) list.vacationMode = vacationMode;

    await list.save();
    res.json(list);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active subscription lists (for admin)
// @route   GET /api/subscriptions/active
// @access  Private/Admin/Manager
export const getActiveSubscriptions = async (req, res, next) => {
  try {
    const lists = await Subscription.find({ 
        status: 'Active',
        items: { $exists: true, $ne: [] } 
    })
      .populate('customer', 'name email mobile')
      .populate('items.product');
    res.json(lists);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all subscription lists (for admin)
// @route   GET /api/subscriptions
// @access  Private/Admin/Manager
export const getAllSubscriptions = async (req, res, next) => {
  try {
    const lists = await Subscription.find({ 
        items: { $exists: true, $ne: [] } 
    })
      .sort('-createdAt')
      .populate('customer', 'name email mobile')
      .populate('items.product');
    res.json(lists);
  } catch (error) {
    next(error);
  }
};

// @desc    Automatically generate orders for today from active subscription lists
// @route   POST /api/subscriptions/generate-orders
// @access  Private/Admin/Manager
export const generateDailyOrders = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayOfMonth = today.getDate();

        const activeLists = await Subscription.find({ status: 'Active' })
            .populate('items.product')
            .populate('customer');

        let createdOrdersCount = 0;
        let errorCount = 0;

        for (const list of activeLists) {
            try {
                if (!list.customer || !list.items || list.items.length === 0) continue;

                const startDate = new Date(list.startDate);
                startDate.setHours(0, 0, 0, 0);

                // 1. Basic guard checks
                if (today < startDate) continue;

                if (list.vacationMode && list.vacationMode.isOn) {
                    const start = new Date(list.vacationMode.startDate);
                    const end = new Date(list.vacationMode.endDate);
                    if (today >= start && today <= end) continue;
                }

                // 2. Frequency logic
                let isDue = false;
                if (list.type === 'Daily') {
                    isDue = true;
                } else if (list.type === 'Alternate') {
                    const diffTime = Math.abs(today - startDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays % 2 === 0) isDue = true;
                } else if (list.type === 'Monthly') {
                    if (list.customDates.includes(dayOfMonth)) isDue = true;
                }

                if (!isDue) continue;

                // 3. Skip if already generated order today for this type
                const exactOrder = await Order.findOne({
                    customer: list.customer._id,
                    subscription: list._id,
                    createdAt: { $gte: today }
                });
                if (exactOrder) continue;

                // 4. Create Order
                const profile = await CustomerProfile.findOne({ user: list.customer._id });
                const defaultAddr = profile ? profile.addresses.find(a => a.isDefaultDelivery) || profile.addresses[0] : null;

                let itemsPrice = 0;
                let taxPrice = 0;
                const orderItems = [];

                for (const item of list.items) {
                    const product = item.product;
                    if (!product || !product.isActive) continue; // Skip inactive products

                    const price = item.quantity * product.price;
                    const tax = price * (product.taxPercentage / 100);

                    itemsPrice += price;
                    taxPrice += tax;

                    orderItems.push({
                        name: product.name,
                        quantity: item.quantity,
                        image: product.image,
                        price: product.price,
                        product: product._id
                    });
                }

                if (orderItems.length === 0) continue;

                // Validate minimum subscription amount
                const SettingsModel = (await import('../../settings/models/Settings.js')).default;
                const settingsData = await SettingsModel.findOne({ id: 'store-settings' });
                const minSubscriptionAmount = settingsData ? settingsData.minSubscriptionAmount || 0 : 0;

                if (itemsPrice < minSubscriptionAmount) {
                    list.status = 'Action Required';
                    await list.save();

                    const NotificationModel = (await import('../../notifications/models/Notification.js')).default;
                    await NotificationModel.create({
                        user: list.customer._id,
                        title: 'Subscription Suspended - Under Minimum Amount',
                        message: `Your "${list.type}" subscription has been suspended because the total value (₹${itemsPrice}) is below the configured Minimum Subscription Amount (₹${minSubscriptionAmount}). Please update your subscription list.`,
                        relatedId: list._id.toString()
                    });
                    continue;
                }

                const order = new Order({
                    customer: list.customer._id,
                    subscription: list._id,
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
            } catch (err) {
                console.error(`Error processing list ${list._id}:`, err);
                errorCount++;
            }
        }

        res.json({ success: true, createdOrdersCount, errorCount, message: `System generated ${createdOrdersCount} consolidated orders.` });
    } catch (err) {
        next(err);
    }
};
