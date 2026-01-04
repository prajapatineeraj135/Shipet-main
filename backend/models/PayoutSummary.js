const mongoose = require('mongoose');

const PayoutSummarySchema = new mongoose.Schema({
    payoutId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    totalPayoutAmount: { type: Number, required: true },
    paidOn: Date,
    payoutMethodType: { type: String, enum: ['bank', 'upi', 'wallet'], required: true }, // store method type for history
    payoutReference: String,
    utrNumber: String,
    shipmentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' }]
}, {
    timestamps: true
});

module.exports = mongoose.model('PayoutSummary', PayoutSummarySchema);
