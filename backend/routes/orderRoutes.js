const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

// Create new order
router.post('/', orderController.createOrder);

// Get all orders (with optional filters)
router.get('/', orderController.getAllOrders);

// Get order statistics
router.get('/stats', orderController.getOrderStats);

// Get specific order by ID
router.get('/:id', orderController.getAllOrders);

// Update order
router.put('/:id', orderController.updateOrder);

// Update order status only
router.patch('/:id/status', orderController.updateOrderStatus);

// Delete order (admin only)
router.delete('/:id', orderController.deleteOrder);

module.exports = router;