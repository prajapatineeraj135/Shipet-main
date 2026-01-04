const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    commissionPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    discountDisplay: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    period: {
        type: String,
        enum: ['Free Forever', 'per month', 'per year'],
        default: 'per month'
    },
    features: [{
        type: String,
        required: true
    }],
    iconType: {
        type: String,
        enum: ['shield', 'star', 'zap', 'crown'],
        default: 'shield'
    },
    colorClass: {
        type: String,
        default: 'bg-gray-500'
    },
    isPopular: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for better query performance
planSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('Plan', planSchema);