import Settings from '../models/Settings.js';

// @desc    Get store settings
// @route   GET /api/settings
// @access  Public
export const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ id: 'store-settings' });
    
    if (!settings) {
      settings = await Settings.create({ id: 'store-settings' });
    }
    
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// @desc    Update store settings
// @route   PUT /api/settings
// @access  Private/Admin/Manager
export const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ id: 'store-settings' });
    
    if (!settings) {
      settings = await Settings.create({ id: 'store-settings' });
    }

    const { shippingPercentage, freeShippingThreshold } = req.body;
    
    settings.shippingPercentage = shippingPercentage !== undefined ? shippingPercentage : settings.shippingPercentage;
    settings.freeShippingThreshold = freeShippingThreshold !== undefined ? freeShippingThreshold : settings.freeShippingThreshold;

    const updatedSettings = await settings.save();
    res.json({ success: true, data: updatedSettings });
  } catch (error) {
    next(error);
  }
};
