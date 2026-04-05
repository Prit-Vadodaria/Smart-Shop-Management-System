import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';

// Helper to update stock
const updateStock = async (orderItems, increment = true) => {
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { countInStock: increment ? item.quantity : -item.quantity }
    });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Customer/Staff)
export const addOrderItems = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      orderType,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      customerId, // For POS
      isPaid, // For POS
      isDelivered, // For POS
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      res.status(400);
      throw new Error('No order items');
    } else {
      // Deduct stock
      await updateStock(orderItems, false);

      // Determine customer
      let finalCustomer = req.user._id;
      if (customerId && (req.user.role === 'Admin' || req.user.role === 'Manager')) {
        finalCustomer = customerId;
      }

      const orderData = {
        orderItems,
        customer: finalCustomer,
        shippingAddress,
        paymentMethod,
        orderType,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      };

      if (isPaid) {
        orderData.isPaid = true;
        orderData.paidAt = Date.now();
      }

      if (isDelivered) {
        orderData.isDelivered = true;
        orderData.deliveredAt = Date.now();
        orderData.status = 'Delivered';
      }

      const order = new Order(orderData);

      const createdOrder = await order.save();
      res.status(201).json(createdOrder);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'customer',
      'name email'
    );

    if (order) {
      // Allow access if admin/manager or if it's the user's order
      res.json(order);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.payer?.email_address,
      };

      const updatedOrder = await order.save();

      const populatedOrder = await Order.findById(updatedOrder._id)
        .populate('customer', 'id name')
        .populate('assignedTo', 'id name email role');

      res.json(populatedOrder);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (e.g., Packed, Delivered)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin/Manager/Staff
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
      // Check if order is already delivered or cancelled
      if (['Delivered', 'Picked Up', 'Cancelled'].includes(order.status)) {
        return res.status(400).json({ success: false, message: `Cannot change status of a ${order.status} order.` });
      }

      // Restore stock if being cancelled
      if (status === 'Cancelled' && order.status !== 'Cancelled') {
        await updateStock(order.orderItems, true);
      }

      order.status = status;

      if (status === 'Delivered' || status === 'Picked Up') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
      }

      const updatedOrder = await order.save();

      const populatedOrder = await Order.findById(updatedOrder._id)
        .populate('customer', 'id name')
        .populate('assignedTo', 'id name email role');

      res.json(populatedOrder);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user._id });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin/Manager/Staff
export const getOrders = async (req, res, next) => {
  try {
    let query = {};
    // If user is Staff, only show orders assigned to them
    if (req.user.role === 'Staff') {
      query = { assignedTo: req.user._id };
    }

    const orders = await Order.find(query)
      .populate('customer', 'id name')
      .populate('assignedTo', 'id name email role');
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Assign order to staff
// @route   PUT /api/orders/:id/assign
// @access  Private/Admin/Manager
export const assignOrderToStaff = async (req, res, next) => {
  try {
    const { staffId } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
      // Check if order is already delivered or cancelled
      if (['Delivered', 'Picked Up', 'Cancelled'].includes(order.status)) {
        return res.status(400).json({ success: false, message: `Cannot reassign a ${order.status} order.` });
      }

      order.assignedTo = staffId || null;
      const updatedOrder = await order.save();

      // Notify the staff member
      if (staffId) {
        await Notification.create({
          user: staffId,
          title: 'New Order Assigned',
          message: `You have been assigned to order ORD-${order._id.toString().substring(order._id.toString().length-8).toUpperCase()} for delivery.`,
          relatedId: order._id.toString()
        });
      }

      const populatedOrder = await Order.findById(updatedOrder._id)
        .populate('customer', 'id name')
        .populate('assignedTo', 'id name email role');

      res.json(populatedOrder);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private (Owner/Admin)
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      // Check if order belongs to user or if user is Admin/Manager
      if (order.customer.toString() !== req.user._id.toString() && !['Admin', 'Manager'].includes(req.user.role)) {
        res.status(401);
        throw new Error('Not authorized to cancel this order');
      }

      // Check if status allows cancellation
      if (!['Pending', 'Packed', 'Ready to deliver', 'Pickup Ready'].includes(order.status)) {
        return res.status(400).json({ success: false, message: `Cannot cancel an order that is ${order.status}` });
      }

      // Restore stock
      await updateStock(order.orderItems, true);

      order.status = 'Cancelled';

      const updatedOrder = await order.save();

      const populatedOrder = await Order.findById(updatedOrder._id)
        .populate('customer', 'id name')
        .populate('assignedTo', 'id name email role');

      res.json(populatedOrder);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      if (['Admin', 'Manager'].includes(req.user.role)) {
        await Order.deleteOne({ _id: order._id });
        res.json({ success: true, message: 'Order deleted successfully' });
      } else {
        res.status(401);
        throw new Error('Not authorized to delete orders');
      }
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};
