const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: { type: String, required: true },
    pid: { type: String, unique: true, required: true }, // Unique product ID
    description: { type: String },
    price: { type: Number, required: true },
    weight: { type: Number, required: true }, // in grams
    dimensions: {
        length: { type: Number, required: true },
        breadth: { type: Number, required: true },
        height: { type: Number, required: true },
        unit: { type: String, default: 'cm' },
    },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
