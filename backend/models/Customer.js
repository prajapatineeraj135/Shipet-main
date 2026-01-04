const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    alt_mobile: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String }, // 2-letter state code
    pincode: { type: String },
    country_code: { type: String }
}, {
    timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);
