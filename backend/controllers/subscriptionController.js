import Subscription from '../models/Subscription.js';
import Product from '../models/Product.js';

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
// @route   GET /api/subscriptions
// @access  Private/Admin/Manager
export const getActiveSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ status: 'Active' }).populate('customer').populate('product');
    res.json(subscriptions);
  } catch (error) {
    next(error);
  }
};
