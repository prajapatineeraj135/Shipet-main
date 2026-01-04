const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastRechargeAt: {
        type: Date
    },
    lastUsedAt: {
        type: Date
    },
    totalRecharged: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// // Index for faster queries
// walletSchema.index({ userId: 1 });

// Virtual for wallet status
walletSchema.virtual('status').get(function () {
    if (!this.isActive) return 'inactive';
    if (this.balance <= 0) return 'empty';
    if (this.balance < 100) return 'low';
    return 'active';
});

module.exports = mongoose.model('Wallet', walletSchema);