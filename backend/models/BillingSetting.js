const mongoose = require('mongoose');

const BillingSettingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },

    // Company Information
    companyName: { type: String },
    gstNumber: { type: String },
    panNumber: { type: String },

    // Billing Address (Similar to Pickup Address)
    nickname: {
        type: String,
        required: true,
        match: [/^[A-Za-z]+$/, "Nickname must contain only alphabets and no spaces"],
        default: "BillingAddress"
    },
    name: { type: String, required: true }, // Contact person name
    email: { type: String, required: true },
    phone: {
        type: String,
        required: true,
        match: [/^\d{10}$/, "Phone must be a 10-digit number without +91 or 0"],
    },
    altPhone: {
        type: String,
        match: [/^\d{10}$/, "Alt Phone must be a 10-digit number"],
    },

    // Address Fields (Same as Pickup Address)
    street1: { type: String, required: true },
    street2: { type: String },
    locality: { type: String },
    city: { type: String, required: true },
    pincode: {
        type: String,
        required: true,
        match: [/^\d{6}$/, "Pincode must be a 6-digit number"],
    },

    // Zone, Country (similar to pickup address)
    zoneId: { type: Number, required: true },
    countryId: { type: String, default: "99" }, // Only 99 (India)

    // Payment Method Details
    codRemittancePaymentMethod: {
        type: String,
        enum: ['bank', 'upi', 'wallet'],
        default: 'bank'
    },

    // Bank Details
    bankDetails: {
        accountNumber: String,
        ifscCode: String,
        accountHolderName: String,
        bankName: String
    },

    // UPI Details
    upiDetails: {
        upiId: String,
        verifiedName: String
    },

    // Status Fields
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: true }, // First billing address is always default

    // Verification
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'failed'],
        default: 'pending'
    },
    verificationDate: Date,
}, {
    timestamps: true
});

module.exports = mongoose.model('BillingSetting', BillingSettingSchema);
