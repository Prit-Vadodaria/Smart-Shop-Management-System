import Product from '../models/Product.js';
import User from '../../auth/models/User.js';
import Subscription from '../../subscriptions/models/Subscription.js';
import Notification from '../../notifications/models/Notification.js';
import { getUploadedImagePath } from '../../../middleware/uploadMiddleware.js';
import { parseProductBody } from '../../../utils/parseProductBody.js';

const applyUploadedImage = (body, file) => {
  if (file) {
    body.image = getUploadedImagePath(file.filename);
  }
  return body;
};

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: 'i',
          },
        }
      : {};

    // Standard lookup only returns soft-active products (isActive: true)
    // Staff/Admin can bypass by adding showInactive=true in query
    const showInactive = req.query.showInactive === 'true' && req.user && ['admin', 'employee'].includes(req.user.role);
    const filter = showInactive ? { ...keyword } : { ...keyword, isActive: true };

    const products = await Product.find(filter);
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product && (product.isActive || (req.query.showInactive === 'true' && req.user && ['admin', 'employee'].includes(req.user.role)))) {
      res.json({ success: true, data: product });
    } else {
      res.status(404).json({ success: false, message: 'Product not found or has been removed' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get products with low stock (countInStock <= minStockThreshold)
// @route   GET /api/products/low-stock
// @access  Private/Admin/Manager
export const getLowStockProducts = async (req, res, next) => {
  try {
    // Only track low stock of active products
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ["$countInStock", "$minStockThreshold"] }
    });
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/products/dashboard-stats
// @access  Private/Admin/Manager
export const getDashboardStats = async (req, res, next) => {
  try {
    // Stats calculated from active products
    const products = await Product.find({ isActive: true });
    
    // Total Inventory Value: Sum of price * countInStock
    const totalInventoryValue = products.reduce((acc, p) => acc + (p.price * p.countInStock), 0);
    
    // Total Products in Stock: Sum of countInStock
    const totalProductsInStock = products.reduce((acc, p) => acc + p.countInStock, 0);
    
    // Total Customers: Count users with role 'customer'
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    
    // Active Subscriptions: Count active, non-empty subscription lists
    const activeSubscriptions = await Subscription.countDocuments({ 
        status: 'Active',
        items: { $exists: true, $ne: [] }
    });

    res.json({
      success: true,
      data: {
        totalInventoryValue,
        totalProductsInStock,
        totalCustomers,
        activeSubscriptions
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin/Manager/Staff
export const createProduct = async (req, res, next) => {
  try {
    const body = applyUploadedImage(parseProductBody(req.body), req.file);
    const { name } = body;

    const productExists = await Product.findOne({ name });
    if (productExists) {
      if (!productExists.isActive) {
        productExists.isActive = true;
        Object.assign(productExists, body, { user: req.user._id });
        const savedProduct = await productExists.save();
        return res.status(200).json({ success: true, message: 'Reactivated existing product', data: savedProduct });
      }
      return res.status(400).json({ success: false, message: 'Product with this name already exists' });
    }

    const product = new Product({
      ...body,
      user: req.user._id,
    });

    const createdProduct = await product.save();
    res.status(201).json({ success: true, data: createdProduct });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin/Manager
export const updateProduct = async (req, res, next) => {
  try {
    const body = applyUploadedImage(parseProductBody(req.body), req.file);
    const {
      name,
      price,
      description,
      brand,
      category,
      countInStock,
      taxPercentage,
      minStockThreshold,
      isSubscriptionEligible,
      minSubscriptionQuantity,
      isActive,
    } = body;

    const product = await Product.findById(req.params.id);

    if (product) {
      if (name && name !== product.name) {
        const productExists = await Product.findOne({ name });
        if (productExists) {
          return res.status(400).json({ success: false, message: 'Another product with this name already exists' });
        }
      }

      if (name) product.name = name;
      if (price !== undefined) product.price = price;
      if (description) product.description = description;
      if (body.image) product.image = body.image;
      if (brand) product.brand = brand;
      if (category) product.category = category;
      if (countInStock !== undefined) product.countInStock = countInStock;
      if (taxPercentage !== undefined) product.taxPercentage = taxPercentage;
      if (minStockThreshold !== undefined) product.minStockThreshold = minStockThreshold;
      if (isSubscriptionEligible !== undefined) product.isSubscriptionEligible = isSubscriptionEligible;
      if (minSubscriptionQuantity !== undefined) product.minSubscriptionQuantity = minSubscriptionQuantity;
      if (isActive !== undefined) product.isActive = isActive;

      const updatedProduct = await product.save();
      res.json({ success: true, data: updatedProduct });
    } else {
      res.status(404).json({ success: false, message: 'Product not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product (Soft Delete)
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // Perform soft delete by setting isActive to false
      product.isActive = false;
      await product.save();

      // Automatically suspend subscriptions containing this retired product
      const subscriptions = await Subscription.find({
        'items.product': product._id,
        status: { $in: ['Active', 'Paused'] }
      });

      for (const sub of subscriptions) {
        sub.status = 'Action Required';
        await sub.save();

        // Create alert notification for the customer
        await Notification.create({
          user: sub.customer,
          title: 'Subscription Suspended - Action Required',
          message: `Your "${sub.type}" subscription has been suspended because the product "${product.name}" is no longer active in our store. Please update your subscription list.`,
          relatedId: sub._id.toString()
        });
      }
      
      res.json({ 
        success: true, 
        message: `Product soft-deleted. Suspended ${subscriptions.length} active subscriptions.` 
      });
    } else {
      res.status(404).json({ success: false, message: 'Product not found' });
    }
  } catch (error) {
    next(error);
  }
};
