import CustomerProfile from '../models/CustomerProfile.js';
import User from '../models/User.js';

// @desc    Get logged in customer profile
// @route   GET /api/customers/profile
// @access  Private
export const getCustomerProfile = async (req, res, next) => {
  try {
    const profile = await CustomerProfile.findOne({ user: req.user._id }).populate('user', 'name email');
    
    if (profile) {
      res.json(profile);
    } else {
      res.status(404);
      throw new Error('Profile not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update customer profile
// @route   POST /api/customers/profile
// @access  Private
export const setupCustomerProfile = async (req, res, next) => {
  try {
    const { phone, addresses } = req.body;
    
    let profile = await CustomerProfile.findOne({ user: req.user._id });

    if (profile) {
      profile.phone = phone || profile.phone;
      if (addresses) profile.addresses = addresses;
      const updatedProfile = await profile.save();
      res.json(updatedProfile);
    } else {
      // Create logic
      profile = new CustomerProfile({
        user: req.user._id,
        customerId: `CUST${Date.now()}`,
        phone,
        addresses: addresses || []
      });
      const createdProfile = await profile.save();
      res.status(201).json(createdProfile);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add new address
// @route   POST /api/customers/address
// @access  Private
export const addAddress = async (req, res, next) => {
  try {
    const profile = await CustomerProfile.findOne({ user: req.user._id });
    if (!profile) {
      res.status(404);
      throw new Error('Profile not found');
    }

    const { tag, addressLine1, addressLine2, city, state, pincode, isDefaultDelivery } = req.body;

    // If new address is setting default true, set others to false
    if (isDefaultDelivery) {
        profile.addresses.forEach(addr => addr.isDefaultDelivery = false);
    }

    profile.addresses.push({ tag, addressLine1, addressLine2, city, state, pincode, isDefaultDelivery });
    await profile.save();

    res.json(profile);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all customers (Admin)
// @route   GET /api/customers
// @access  Private/Admin/Manager
export const getCustomers = async (req, res, next) => {
  try {
    const customers = await CustomerProfile.find({}).populate('user', 'name email');
    res.json(customers);
  } catch (error) {
    next(error);
  }
};
