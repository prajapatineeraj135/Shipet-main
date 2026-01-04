const Order = require('../models/Order');
const Shipment = require('../models/Shipment');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const mongoose = require('mongoose');
// ✅ Create Order
exports.createOrder = async (req, res) => {
    try {
        const { customerId, products, paymentMethod, shippingAddress, orderNotes, totalAmount } = req.body;
        const userId = new mongoose.Types.ObjectId(req.user._id);
        // Validate customer
        console.log(userId)
        const customer = await Customer.findOne({ _id: customerId, userId });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
                error: 'Customer not found'
            });
        }

        // Validate and process products
        const productEntries = [];

        for (const item of products) {
            const product = await Product.findOne({ _id: item.productId, userId });
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.pid || item.productId}`,
                    error: `Product not found: ${item.pid || item.productId}`
                });
            }

            const quantity = item.quantity || 1;
            const price = item.price || product.price;

            productEntries.push({
                product: product._id,
                quantity: quantity,
                price: price
            });

        }

        // Create order
        const newOrder = await Order.create({
            customer: customer._id,
            products: productEntries,
            paymentMethod,
            shippingAddress: {
                ...shippingAddress,
                country_code: shippingAddress.country_code || 'IN'
            },
            orderNotes,
            totalAmount,
            userId
        });

        // Populate the created order
        const populatedOrder = await Order.findById(newOrder._id)
            .populate('customer', 'name mobile alt_mobile address city state pincode country_code')
            .populate('products.product', 'name pid price description')
            .populate('shipment');

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: populatedOrder
        });
    } catch (err) {
        console.error('Order Creation Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: 'Internal Server Error'
        });
    }
};

// ✅ Get All Orders
exports.getAllOrders = async (req, res) => {
    try {
        const clientOrderId = req.params.id;
        const userId = new mongoose.Types.ObjectId(req.user._id);
        console.log(userId)
        if (clientOrderId) {
            const order = await Order.findOne({ client_order_id: clientOrderId, userId })
                .populate('customer products.product shipment');
            if (!order) return res.status(404).json({ error: 'Order not found' });
            return res.json({
                success: true,
                message: 'order fetched successfully',
                data: order
            });
        }

        const orders = await Order.find({ userId })
            .populate('customer products.product shipment')
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            message: 'orders fetched successfully',
            data: orders,
        });
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: 'Internal Server Error'
        });
    }
};

// ✅ Get Order by ID
exports.getOrderById = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id);
        const clientOrderId = req.params.id;
        const order = await Order.findOne({ client_order_id: clientOrderId, userId })
            .populate('customer', 'name mobile alt_mobile address city state pincode country_code')
            .populate('products.product', 'name pid price description')
            .populate('shipment');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
                error: 'Order not found'
            });
        }

        res.json({
            success: true,
            message: 'Order fetched successfully',
            data: order
        });
    } catch (err) {
        console.error('Error fetching order:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order',
            error: 'Internal Server Error'
        });
    }
};

// ✅ Update Order
exports.updateOrder = async (req, res) => {
    try {
        const updateData = req.body;
        const userId = new mongoose.Types.ObjectId(req.user._id);
        const clientOrderId = req.params.id;
        // Remove fields that shouldn't be updated directly
        delete updateData._id;
        delete updateData.client_order_id;
        delete updateData.createdAt;
        const order = await Order.findOne({ client_order_id: clientOrderId, userId })
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
                error: 'Order not found'
            });
        }

        // If products are being updated, recalculate total
        if (updateData.products) {
            let totalAmount = 0;
            for (const item of updateData.products) {
                const product = await Product.findById(item.product || item.productId);
                if (product) {
                    totalAmount += (item.quantity || 1) * (item.price || product.price);
                }
            }
            updateData.totalAmount = totalAmount;
        }

        const updatedOrder = await Order.findOneAndUpdate(
            { _id: order._id, userId },
            updateData,
            { new: true, runValidators: true }
        )
            .populate('customer', 'name mobile email')
            .populate('products.product', 'name sku price')
            .populate('shipment');

        res.json({
            success: true,
            message: 'Order updated successfully',
            data: updatedOrder
        });
    } catch (err) {
        console.error('Update Order Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update order',
            error: 'Internal Server Error'
        });
    }
};

// ✅ Update Order Status
exports.updateOrderStatus = async (req, res) => {
    try {

    } catch (err) {

    }
};

// ✅ Delete Order (Admin only)
exports.deleteOrder = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id);
        const clientOrderId = req.params.id;

        const order = await Order.findOne({ client_order_id: clientOrderId, userId });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
                error: 'Order not found'
            });
        }

        await Order.deleteOne({ _id: order._id });
        res.json({
            success: true,
            message: 'Order deleted successfully'
        });

    } catch (err) {
        console.error('Delete Order Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to delete order',
            error: 'Internal Server Error'
        });
    }
};

// ✅ Get Order Statistics
exports.getOrderStats = async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const matchStage = { userId };
    try {
        const stats = await Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$hasShipment',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ]);

        const totalOrders = await Order.countDocuments(matchStage);
        const totalRevenue = await Order.aggregate([{ $match: matchStage },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        res.json({
            success: true,
            message: 'Order statistics fetched successfully',
            data: {
                totalOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                statusBreakdown: stats
            }
        });
    } catch (err) {
        console.error('Get Stats Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order statistics',
            error: 'Internal Server Error'
        });
    }
};