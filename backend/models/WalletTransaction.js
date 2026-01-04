const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    reference: {
        type: String,
        required: true,
        unique: true
    },
    orderId: {
        type: String,
        sparse: true
    },
    shipmentId: {
        type: String,
        sparse: true,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['online', 'upi', 'card', 'netbanking', 'wallet'],
        default: 'online'
    },
    completedAt: {
        type: Date
    },
    failedAt: {
        type: Date
    },
    failureReason: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    balanceAfter: {
        type: Number
    },
    balanceBefore: {
        type: Number
    }
}, {
    timestamps: true
});

// Indexes for better query performance
walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ reference: 1 });
walletTransactionSchema.index({ orderId: 1 }, { sparse: true });
walletTransactionSchema.index({ shipmentId: 1 }, { sparse: true });
walletTransactionSchema.index({ type: 1, status: 1 });

// Pre-save middleware to calculate balance
walletTransactionSchema.pre('save', async function (next) {
    if (this.isNew && this.status === 'completed') {
        const Wallet = mongoose.model('Wallet');
        const wallet = await Wallet.findOne({ userId: this.userId });

        if (wallet) {
            this.balanceBefore = wallet.balance;

            if (this.type === 'credit') {
                this.balanceAfter = wallet.balance + this.amount;
            } else {
                this.balanceAfter = wallet.balance - this.amount;
            }
        }
    }
    next();
});

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
