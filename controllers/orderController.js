const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, deliveryMethod, paymentMethod, notes } = req.body;

    // Calculate total amount and validate items
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient quantity for ${product.name}. Available: ${product.quantity}` 
        });
      }

      if (item.quantity < product.minOrder) {
        return res.status(400).json({ 
          message: `Minimum order quantity for ${product.name} is ${product.minOrder}` 
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: item.product,
        quantity: item.quantity,
        price: product.price
      });

      // Update product quantity
      product.quantity -= item.quantity;
      if (product.quantity === 0) {
        product.isAvailable = false;
      }
      await product.save();
    }

    const farmer = await Product.findById(items[0].product).select('farmer');

    const order = await Order.create({
      customer: req.user.id,
      farmer: farmer.farmer,
      items: orderItems,
      totalAmount,
      shippingAddress,
      deliveryMethod,
      paymentMethod,
      notes
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name phone')
      .populate('farmer', 'name phone')
      .populate('items.product', 'name images unit');

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 
      $or: [
        { customer: req.user.id },
        { farmer: req.user.id }
      ]
    })
      .populate('customer', 'name phone avatar')
      .populate('farmer', 'name phone avatar')
      .populate('items.product', 'name images unit')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name phone avatar profile')
      .populate('farmer', 'name phone avatar profile')
      .populate('items.product', 'name images unit category');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is involved in the order
    if (order.customer._id.toString() !== req.user.id && 
        order.farmer._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Farmer or Customer)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is authorized to update status
    if (order.customer.toString() !== req.user.id && 
        order.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    // Farmers can update to preparing, ready, in_transit
    // Customers can update to delivered, cancelled (with restrictions)
    if (req.user.id === order.customer.toString()) {
      if (!['delivered', 'cancelled'].includes(status)) {
        return res.status(403).json({ message: 'Customers can only mark as delivered or cancel orders' });
      }
      
      if (status === 'cancelled' && order.status !== 'pending') {
        return res.status(400).json({ message: 'Cannot cancel order after confirmation' });
      }
    }

    order.status = status;
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('customer', 'name phone avatar')
      .populate('farmer', 'name phone avatar')
      .populate('items.product', 'name images unit');

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment
// @access  Private
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, mpesaCode } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only customer can update payment status
    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update payment status' });
    }

    order.paymentStatus = paymentStatus;
    if (mpesaCode) order.mpesaCode = mpesaCode;
    
    await order.save();

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
