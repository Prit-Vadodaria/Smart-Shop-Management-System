import Product from '../models/Product.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({});
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

    if (product) {
      res.json({ success: true, data: product });
    } else {
      res.status(404).json({ success: false, message: 'Product not found' });
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
    const products = await Product.find({
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
    const products = await Product.find({});
    
    // Total Inventory Value: Sum of price * countInStock
    const totalInventoryValue = products.reduce((acc, p) => acc + (p.price * p.countInStock), 0);
    
    // Total Products in Stock: Sum of countInStock
    const totalProductsInStock = products.reduce((acc, p) => acc + p.countInStock, 0);
    
    // Total Customers: Count users with role 'Customer'
    const totalCustomers = await User.countDocuments({ role: 'Customer' });
    
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
    const { name } = req.body;
    
    // Check if product with same name already exists
    const productExists = await Product.findOne({ name });
    if (productExists) {
      return res.status(400).json({ success: false, message: 'Product with this name already exists' });
    }

    const product = new Product({
      ...req.body,
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
    const {
      name,
      price,
      description,
      image,
      brand,
      category,
      countInStock,
      taxPercentage,
      minStockThreshold,
      isSubscriptionEligible,
      minSubscriptionQuantity
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      // Check if product name is being updated to something already taken
      if (name && name !== product.name) {
        const productExists = await Product.findOne({ name });
        if (productExists) {
           return res.status(400).json({ success: false, message: 'Another product with this name already exists' });
        }
      }

      product.name = name || product.name;
      product.price = price || product.price;
      product.description = description || product.description;
      product.image = image || product.image;
      product.brand = brand || product.brand;
      product.category = category || product.category;
      product.countInStock = countInStock !== undefined ? countInStock : product.countInStock;
      product.taxPercentage = taxPercentage !== undefined ? taxPercentage : product.taxPercentage;
      product.minStockThreshold = minStockThreshold !== undefined ? minStockThreshold : product.minStockThreshold;
      product.isSubscriptionEligible = isSubscriptionEligible !== undefined ? isSubscriptionEligible : product.isSubscriptionEligible;
      product.minSubscriptionQuantity = minSubscriptionQuantity !== undefined ? minSubscriptionQuantity : product.minSubscriptionQuantity;

      const updatedProduct = await product.save();
      res.json({ success: true, data: updatedProduct });
    } else {
      res.status(404).json({ success: false, message: 'Product not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await Product.deleteOne({ _id: product._id });
      res.json({ success: true, message: 'Product removed' });
    } else {
      res.status(404).json({ success: false, message: 'Product not found' });
    }
  } catch (error) {
    next(error);
  }
};
