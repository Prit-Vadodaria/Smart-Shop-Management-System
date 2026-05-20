import Order from '../models/Order.js';
import Product from '../../products/models/Product.js';
import Notification from '../../notifications/models/Notification.js';
import Subscription from '../../subscriptions/models/Subscription.js';
import CustomerProfile from '../../customers/models/CustomerProfile.js';

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
      customerId,
      customerName, 
      isPaid,
      isDelivered,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    }

    // Determine the customer
    let finalCustomer = req.user._id;
    let finalCustomerName = null;

    const canPosForCustomer =
      req.user.role === 'admin' ||
      req.user.role === 'employee';

    if (canPosForCustomer) {
      if (customerId) {
        finalCustomer = customerId;
      } else if (customerName) {
        finalCustomer = null; 
        finalCustomerName = customerName;
      }
    }

    // Deduct stock
    await updateStock(orderItems, false);

    const order = new Order({
      orderItems,
      customer: finalCustomer,
      customerName: finalCustomerName,
      shippingAddress,
      paymentMethod,
      orderType,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    if (isPaid) {
      order.isPaid = true;
      order.paidAt = Date.now();
    }

    if (isDelivered) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.status = 'Delivered';
      // If delivered at creation, mark as paid if not already
      if (!order.isPaid) {
        order.isPaid = true;
        order.paidAt = Date.now();
      }
    }

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
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
      res.json(order);
    } else {
      res.status(404).json({ success: false, message: 'Order not found' });
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
      res.status(404).json({ success: false, message: 'Order not found' });
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
        // Automatically mark as paid upon delivery if not already paid
        if (!order.isPaid) {
          order.isPaid = true;
          order.paidAt = Date.now();
        }
      }

      const updatedOrder = await order.save();

      const populatedOrder = await Order.findById(updatedOrder._id)
        .populate('customer', 'id name')
        .populate('assignedTo', 'id name email role');

      res.json(populatedOrder);
    } else {
      res.status(404).json({ success: false, message: 'Order not found' });
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
    // Staff see only assigned orders; managers see all (like admin)
    if (req.user.role === 'employee' && req.user.employeeType === 'staff') {
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
      res.status(404).json({ success: false, message: 'Order not found' });
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
      if (order.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(401).json({ success: false, message: 'Not authorized to cancel this order' });
        return;
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
      res.status(404).json({ success: false, message: 'Order not found' });
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
      if (req.user.role === 'admin') {
        await Order.deleteOne({ _id: order._id });
        res.json({ success: true, message: 'Order deleted successfully' });
      } else {
        res.status(401).json({ success: false, message: 'Not authorized to delete orders' });
      }
    } else {
      res.status(404).json({ success: false, message: 'Order not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger checkout for a scheduled subscription (Automated/Cashier checkout)
// @route   POST /api/orders/subscription-checkout
// @access  Private/Admin/Manager
export const subscriptionCheckout = async (req, res, next) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ success: false, message: 'Please provide a subscription ID' });
    }

    const list = await Subscription.findById(subscriptionId)
      .populate('items.product')
      .populate('customer');

    if (!list) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    if (list.status !== 'Active') {
      return res.status(400).json({ success: false, message: `Cannot trigger checkout. Subscription is in status: "${list.status}"` });
    }

    // Vacation mode check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (list.vacationMode && list.vacationMode.isOn) {
      const start = new Date(list.vacationMode.startDate);
      const end = new Date(list.vacationMode.endDate);
      if (today >= start && today <= end) {
        return res.status(400).json({ success: false, message: 'Subscription is currently in vacation mode' });
      }
    }

    // Check if subscription order was already generated today
    const exactOrder = await Order.findOne({
      customer: list.customer._id,
      subscription: list._id,
      createdAt: { $gte: today }
    });

    if (exactOrder) {
      return res.status(400).json({ success: true, message: 'An order was already checked out for this subscription today', data: exactOrder });
    }

    // Fetch delivery address
    const profile = await CustomerProfile.findOne({ user: list.customer._id });
    const defaultAddr = profile ? profile.addresses.find(a => a.isDefaultDelivery) || profile.addresses[0] : null;

    let itemsPrice = 0;
    let taxPrice = 0;
    const orderItems = [];

    // Deduct stock and compile checkout details
    for (const item of list.items) {
      const product = item.product;
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: `Cannot complete checkout. Product "${product ? product.name : 'Unknown'}" is inactive.` });
      }

      // Check stock availability
      if (product.countInStock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for product "${product.name}". In Stock: ${product.countInStock}, Needed: ${item.quantity}` });
      }

      const price = item.quantity * product.price;
      const tax = price * (product.taxPercentage / 100);

      itemsPrice += price;
      taxPrice += tax;

      orderItems.push({
        name: product.name,
        quantity: item.quantity,
        image: product.image,
        price: product.price,
        product: product._id
      });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Subscription has no valid items' });
    }

    // Deduct catalog stock
    await updateStock(orderItems, false);

    // Compile order
    const order = new Order({
      customer: list.customer._id,
      subscription: list._id,
      orderItems,
      itemsPrice,
      taxPrice,
      shippingPrice: 0,
      totalPrice: itemsPrice + taxPrice,
      shippingAddress: {
        address: defaultAddr ? `${defaultAddr.addressLine1}, ${defaultAddr.addressLine2 || ''}` : 'No address specified',
        city: defaultAddr ? defaultAddr.city : 'N/A',
        postalCode: defaultAddr ? defaultAddr.pincode : '000000',
        country: 'India'
      },
      orderType: 'Home Delivery',
      paymentMethod: 'Cash',
      isPaid: false,
      status: 'Pending'
    });

    const savedOrder = await order.save();

    res.status(201).json({
      success: true,
      message: 'Subscription order successfully checked out',
      data: savedOrder
    });
  } catch (error) {
    next(error);
  }
};
