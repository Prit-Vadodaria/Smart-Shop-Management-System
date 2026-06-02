import CustomerProfile from '../models/CustomerProfile.js';
import User from '../../auth/models/User.js';
import { publishRealtimeEvent } from '../../../services/realtimeHub.js';

// @desc    Get logged in customer profile
// @route   GET /api/customers/profile
// @access  Private
export const getCustomerProfile = async (req, res, next) => {
  try {
    let profile = await CustomerProfile.findOne({ user: req.user._id }).populate('user', 'name email');

    if (!profile) {
      // Auto-create profile with default values if it doesn't exist
      profile = await CustomerProfile.create({
        user: req.user._id,
        customerId: `CUST${Date.now()}`,
        phone: 'Not provided',
        addresses: []
      });
    }
    res.json({ success: true, data: profile });
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
      publishRealtimeEvent('customer:changed', { customerId: req.user._id.toString(), reason: 'profile_updated' });
      res.json({ success: true, data: updatedProfile });
    } else {
      // Create logic
      profile = new CustomerProfile({
        user: req.user._id,
        customerId: `CUST${Date.now()}`,
        phone,
        addresses: addresses || []
      });
      const createdProfile = await profile.save();
      res.status(201).json({ success: true, data: createdProfile });
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
    // Ensure profile exists, create if missing
    let profile = await CustomerProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await CustomerProfile.create({
        user: req.user._id,
        customerId: `CUST${Date.now()}`,
        phone: 'Not provided',
        addresses: []
      });
    }
    // Extract address fields (fullName and phoneNumber derived automatically)
    const { tag, addressLine1, addressLine2, city, state, pincode, landmark, isDefaultDelivery } = req.body;
    const fullName = req.user.name;
    const phoneNumber = profile.phone || "";
    if (isDefaultDelivery) {
      profile.addresses.forEach(addr => addr.isDefaultDelivery = false);
    }
    profile.addresses.push({ tag, fullName, phoneNumber, addressLine1, addressLine2, city, state, pincode, landmark, isDefaultDelivery });
    await profile.save();
    publishRealtimeEvent('customer:changed', { customerId: req.user._id.toString(), reason: 'address_added' });
    return res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer profile
// @route   PUT /api/customers/profile
// @access  Private
export const updateCustomerProfile = async (req, res, next) => {
  try {
    const { name, phone, preferences } = req.body;
    // Update User name
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (name) user.name = name;
    await user.save();

    // Update or create CustomerProfile
    let profile = await CustomerProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await CustomerProfile.create({
        user: req.user._id,
        customerId: `CUST${Date.now()}`,
        phone: phone && phone.trim() !== '' ? phone : 'Not provided',
        addresses: [],
        preferences: preferences || {}
      });
    } else {
      if (phone && phone.trim() !== '') {
          profile.phone = phone;
        } else if (!profile.phone || profile.phone.trim() === '') {
          profile.phone = 'Not provided';
        }
      if (preferences) profile.preferences = { ...profile.preferences, ...preferences };
      await profile.save();
    }
    publishRealtimeEvent('customer:changed', { customerId: req.user._id.toString(), reason: 'profile_changed' });
    return res.json({ success: true, message: 'Profile updated successfully', data: { user, profile } });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an address
// @route   PUT /api/customers/address/:addressId
// @access  Private
export const updateAddress = async (req, res, next) => {
  try {
    // Ensure profile exists, create if missing
    let profile = await CustomerProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await CustomerProfile.create({
        user: req.user._id,
        phone: "Not provided",
        addresses: []
      });
    }
    const addressIndex = profile.addresses.findIndex(a => a._id.toString() === req.params.addressId);
    if (addressIndex === -1) return res.status(404).json({ success: false, message: 'Address not found' });
    const { tag, addressLine1, addressLine2, city, state, pincode, landmark, isDefaultDelivery } = req.body;
    const fullName = req.user.name;
    const phoneNumber = profile.phone || "";
    if (isDefaultDelivery) profile.addresses.forEach(addr => addr.isDefaultDelivery = false);
    const updatedAddr = {
      ...profile.addresses[addressIndex].toObject(),
      ...(tag && { tag }),
      fullName,
      phoneNumber,
      ...(addressLine1 && { addressLine1 }),
      ...(addressLine2 && { addressLine2 }),
      ...(city && { city }),
      ...(state && { state }),
      ...(pincode && { pincode }),
      ...(landmark && { landmark }),
      ...(isDefaultDelivery !== undefined && { isDefaultDelivery })
    };
    profile.addresses.set(addressIndex, updatedAddr);
    await profile.save();
    publishRealtimeEvent('customer:changed', { customerId: req.user._id.toString(), reason: 'address_updated' });
    return res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an address
// @route   DELETE /api/customers/address/:addressId
// @access  Private
export const deleteAddress = async (req, res, next) => {
  try {
    // Ensure profile exists, create if missing
    let profile = await CustomerProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await CustomerProfile.create({
        user: req.user._id,
        phone: "Not provided",
        addresses: []
      });
    }
    profile.addresses = profile.addresses.filter(a => a._id.toString() !== req.params.addressId);
    await profile.save();
    publishRealtimeEvent('customer:changed', { customerId: req.user._id.toString(), reason: 'address_deleted' });
    return res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};



// @desc    Set default delivery address
// @route   PUT /api/customers/address/:addressId/default-delivery
// @access  Private
export const setDefaultDeliveryAddress = async (req, res, next) => {
  try {
    // Ensure profile exists, create if missing
    let profile = await CustomerProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await CustomerProfile.create({
        user: req.user._id,
        phone: "",
        addresses: []
      });
    }
    const address = profile.addresses.find(a => a._id.toString() === req.params.addressId);
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });
    profile.addresses.forEach(addr => addr.isDefaultDelivery = false);
    address.isDefaultDelivery = true;
    await profile.save();
    publishRealtimeEvent('customer:changed', { customerId: req.user._id.toString(), reason: 'default_address_changed' });
    return res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all customers (Admin)
// @route   GET /api/customers
// @access  Private/Admin/Manager
export const getCustomers = async (req, res, next) => {
  try {
    // Fetch all users with role 'customer'
    const customers = await User.find({ role: 'customer' }).select('name email role');

    // For each customer, try to find their profile
    const results = await Promise.all(customers.map(async (user) => {
      const profile = await CustomerProfile.findOne({ user: user._id });
      return {
        _id: profile ? profile._id : `TEMP_${user._id}`,
        user: {
          _id: user._id, // User ID is crucial for order creation
          name: user.name,
          email: user.email
        },
        phone: profile ? profile.phone : 'N/A',
        customerId: profile ? profile.customerId : 'N/A'
      };
    }));

    res.json(results);
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new customer briefly (Admin/Manager)
// @route   POST /api/customers/quick-customer
// @access  Private/Admin/Manager
export const registerQuickCustomer = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    // Use name as base for email if not provided
    const finalEmail = email || `${name.toLowerCase().replace(/\s+/g, '')}${Date.now()}@temp.com`;
    const password = `${name.toLowerCase().replace(/\s+/g, '')}1234`;

    const userExists = await User.findOne({ email: finalEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Customer already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email: finalEmail,
      password,
      role: 'customer'
    });

    // Automatically provision the CustomerProfile
    const profile = await CustomerProfile.create({
      user: user._id,
      customerId: `CUST${Date.now()}`,
      phone: phone || 'Not provided',
      addresses: []
    });

    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      profile: {
        _id: profile._id,
        customerId: profile.customerId,
        phone: profile.phone
      }
    });
  } catch (error) {
    next(error);
  }
};
