const express = require('express');
const {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  updatePaymentStatus
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, createOrder)
  .get(protect, getMyOrders);

router.route('/:id')
  .get(protect, getOrder);

router.put('/:id/status', protect, updateOrderStatus);
router.put('/:id/payment', protect, updatePaymentStatus);

module.exports = router;
