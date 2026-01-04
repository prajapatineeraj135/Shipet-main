const Customer = require('../models/Customer');
const Order = require('../models/Order');

exports.addCustomer = async (req, res) => {
    try {
        const customer = await Customer.create({
            ...req.body,
            userId: req.user._id, // associate with logged-in user
        });
        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            data: customer,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating customer',
            error: error.message,
        });
    }
};

exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.find({ userId: req.user._id });

        const enriched = await Promise.all(
            customers.map(async (customer) => {
                const orders = await Order.find({ customer: customer._id }).populate('shipment');
                const totalOrders = orders.length;
                const totalSpent = orders.reduce((sum, order) => {
                    return sum + (order.shipment?.billed_amount || 0);
                }, 0);

                return {
                    ...customer.toObject(),
                    totalOrders,
                    totalSpent,
                };
            })
        );

        res.json({
            success: true,
            message: 'Customers fetched successfully',
            data: enriched,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching customers',
            error: error.message,
        });
    }
};

exports.getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.id, userId: req.user._id });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        const orders = await Order.find({ customer: customer._id }).populate('shipment');
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, order) => {
            return sum + (order.totalAmount || 0);
        }, 0);

        res.json({
            success: true,
            data: {
                ...customer.toObject(),
                totalOrders,
                totalSpent,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching customer',
            error: error.message,
        });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findOneAndUpdate({ _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true, runValidators: true });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        res.json({
            success: true,
            message: 'Customer updated successfully',
            data: customer,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating customer',
            error: error.message,
        });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        res.json({
            success: true,
            message: 'Customer deleted successfully',
            data: customer
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting customer',
            error: error.message,
        });
    }
};

exports.getOrdersByCustomer = async (req, res) => {
    try {
        const customerId = req.params.id; // 🔥 fix here

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID is required',
            });
        }

        const orders = await Order.find({ customer: customerId, userId: req.user._id, })
            .populate('customer products.product shipment')
            .sort({ createdAt: -1 });

        if (!orders.length) {
            return res.status(200).json({
                success: true,
                message: 'No orders found for this customer',
                data: [], // empty array instead of 404
            });
        }

        res.status(200).json({
            success: true,
            message: 'Orders fetched successfully',
            data: orders,
        });
    } catch (err) {
        console.error('Error fetching orders by customer:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer orders',
            error: 'Internal Server Error',
        });
    }
};
