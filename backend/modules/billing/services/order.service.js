import Product from '../../products/models/Product.js';

/**
 * Update stock for order items.
 * @param {Array} orderItems - Array of order item objects containing { product, quantity }
 * @param {Boolean} increment - If true, increases stock (restores stock). If false, decreases stock (deducts stock).
 * @param {Object} [session] - Optional Mongoose session for transaction support
 */
export const updateStock = async (orderItems, increment = true, session = null) => {
  const options = session ? { session } : {};
  for (const item of orderItems) {
    const amount = increment ? item.quantity : -item.quantity;
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { countInStock: amount } },
      options
    );
  }
};
