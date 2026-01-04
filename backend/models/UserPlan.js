const mongoose = require('mongoose');

const userPlanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    planId: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        default: null // null for free plans or active subscriptions
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled', 'pending'],
        default: 'active'
    },
    paymentReference: {
        type: String,
        default: null
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: null
    },
    autoRenew: {
        type: Boolean,
        default: true
    },
    previousPlanId: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
userPlanSchema.index({ userId: 1, status: 1 });
userPlanSchema.index({ endDate: 1, status: 1 });

// Method to check if plan is expired
userPlanSchema.methods.isExpired = function () {
    return this.endDate && this.endDate < new Date();
};

// Method to get remaining days
userPlanSchema.methods.getRemainingDays = function () {
    if (!this.endDate) return null; // Free plan or lifetime
    const diff = this.endDate - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

module.exports = mongoose.model('UserPlan', userPlanSchema);