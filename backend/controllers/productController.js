const Product = require('../models/Product');

// @desc    Add a new product
const generatePid = () => {
    return 'P' + Date.now().toString().slice(-6); // e.g., P654321
};

exports.addProduct = async (req, res) => {
    try {
        const userId = req.user._id;
        req.body.pid = req.body.pid || generatePid();
        req.body.userId = userId;
        const product = await Product.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Product added successfully',
            data: product,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to add product',
            data: null,
        });
    }
};

// @desc    Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            message: 'Fetched all products successfully',
            data: products,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch products',
            data: null,
        });
    }
};

// @desc    Get a single product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
                data: null,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product fetched successfully',
            data: product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch product',
            data: null,
        });
    }
};

// @desc    Update a product
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
                data: null,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: product,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update product',
            data: null,
        });
    }
};

// @desc    Delete a product
exports.deleteProduct = async (req, res) => {
    try {
        const deleted = await Product.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });


        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
                data: null,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
            data: deleted,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete product',
            data: null,
        });
    }
};
