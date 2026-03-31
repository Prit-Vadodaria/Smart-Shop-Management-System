import Settings from '../models/Settings.js';

// @desc    Get Settings
// @route   GET /api/settings
// @access  Public
export const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Return default values if not created yet
      settings = new Settings({});
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

// @desc    Update Settings
// @route   PUT /api/settings
// @access  Private/Admin
export const updateSettings = async (req, res, next) => {
    try {
      let settings = await Settings.findOne();
      
      if (!settings) {
          settings = new Settings(req.body);
      } else {
          settings.shopName = req.body.shopName || settings.shopName;
          settings.taxRate = req.body.taxRate !== undefined ? req.body.taxRate : settings.taxRate;
          settings.subscriptionCutOffTime = req.body.subscriptionCutOffTime || settings.subscriptionCutOffTime;
          settings.deliveryRadiusKm = req.body.deliveryRadiusKm || settings.deliveryRadiusKm;
          settings.minimumOrderValue = req.body.minimumOrderValue !== undefined ? req.body.minimumOrderValue : settings.minimumOrderValue;
          settings.currency = req.body.currency || settings.currency;
          settings.logoUrl = req.body.logoUrl || settings.logoUrl;
      }
      
      const updatedSettings = await settings.save();
      res.json(updatedSettings);
    } catch (error) {
      next(error);
    }
};
