import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true
  },
  image: {
    type: String,
    default: 'no-photo.jpg'
  },
  brand: {
    type: String,
    required: [true, 'Please add a brand']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['Electronics', 'Groceries', 'Clothing', 'Dairy', 'Daily Needs'] // Add as needed
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price']
  },
  taxPercentage: {
    type: Number,
    default: 0
  },
  countInStock: {
    type: Number,
    required: true,
    default: 0
  },
  minStockThreshold: {
    type: Number,
    required: true,
    default: 10
  },
  isSubscriptionEligible: {
    type: Boolean,
    default: false
  },
  minSubscriptionQuantity: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

export default mongoose.model('Product', ProductSchema);
