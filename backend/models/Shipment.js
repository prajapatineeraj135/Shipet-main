const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Core shipment identifiers
    shipment_id: { type: String, required: true, unique: true },
    pickup_id: { type: String }, // Changed to String to match API response
    courier_id: { type: String, required: true },
    courier_name: { type: String, required: true },
    awb: { type: String, required: true },
    tracking_url: { type: String },

    // Order reference for consistency
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order', // Make sure the casing matches your model name
        required: true
    },
    client_order_id: { type: String, required: true }, // For easy reference

    // Shipment details
    type: {
        type: String,
        enum: ['Single', 'Multi-Box', 'International'],
        required: true
    },
    shipment_mode: {
        type: String,
        enum: ['S', 'E'],
        default: 'S'
    },

    // Pickup address reference
    pickup_address_id: { type: String, required: true },

    // Consignee details (stored for quick access without populating order)
    consignee: {
        name: { type: String, required: true },
        mobile: { type: String, required: true },
        alt_mobile: { type: String },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        country_code: { type: String, default: 'IN' }
    },

    // Parcel details
    parcel: {
        type: { type: String, enum: ['COD', 'Prepaid'], required: true },
        value: { type: Number, required: true },
        currency: { type: String, default: 'INR' },
        contents: { type: String, default: 'Products' },
        weight: {
            weight: { type: Number },
            unit: { type: String, enum: ['kg', 'gm'], default: 'gm' }
        },
        // For single shipments
        dimensions: {
            length: { type: Number },
            breadth: { type: Number },
            height: { type: Number },
            unit: { type: String }
        },
        // For multi-box shipments (optional)
        boxes: [{
            quantity: Number,
            length: Number,
            breadth: Number,
            height: Number,
            dimension_unit: { type: String, default: 'cm' },
            weight: Number,
            weight_unit: { type: String, enum: ['kg', 'gm'], default: 'gm' }
        }]
    },

    // Cost and billing
    cost_estimate: { type: Number },
    billed_amount: Number,
    billing_date: Date,
    shipping_mode: String,
    billing_zone: String,
    billed_weight: Number,

    // Status tracking
    status: {
        type: String,
    },
    // NDR (Non-Delivery Report) fields
    ndr_status: {
        type: String,
        enum: ['open', 'reattempt_scheduled', 'closed'],
        default: null
    },
    ndr_event_type: {
        type: String,
        enum: [
            'REATTEMPT-CONTACT', 'REATTEMPT', 'MISROUTE', 'DC-ADDRESS',
            'URGENT-DELIVERY', 'REATTEMPT-COD-NOT-READY', 'RTO-MISSING',
            'OPEN-DELIVERY', 'CONSIGNEE-OPENED', 'REFUSED', 'RTO-REATTEMPT',
            'REATTEMPT-NEW-DATE', 'REATTEMPT-RESTRICTED', 'ENTRY',
            'RTO-PACKING', 'REATTEMPT-CUST-REFUSED', 'REATTEMPT-OTP',
            'MANUAL-VERIFY', 'RTO-SECURITY', 'FINANCE-EMBARGO',
            'EWAY-SEND', 'REATTEMPT-DAMAGE', 'REATTEMPT-RTO-REFUSED',
            'REATTEMPT-OUTOFSTN'
        ]
    },
    ndr_reason: { type: String },
    ndr_date: { type: Date },
    ndr_next_attempt_date: { type: Date },
    ndr_remarks: { type: String },
    ndr_action_taken: { type: String },
    ndr_resolved_date: { type: Date },
    label: {
        awb: { type: String },
        sortCode: { type: String },
        parcelType: { type: String },
        parcelValue: { type: String },
        courierName: { type: String },
        courierId: { type: String },
        barcodeImageUrl: { type: String },
        barcodeBase64: { type: String },
        returnAddress: { type: String },
        consigneeAddress: { type: String },
        consigneeMobile: { type: String },
        generatedAt: { type: Date, default: Date.now }
    }
    ,
    isReverse: { type: Boolean, default: false },
    reverseCreatedAt: { type: Date },
    reverse_shipment: {
        shipment_id: String,
        courier_id: String,
        courier_name: String,
        awb: String,
        tracking_url: String,
        pickup_id: String,
    },
    isCancelled: { type: Boolean, default: false },
    cancelledAt: { type: Date },
    // Tracking history
    tracking_history: [{
        status: String,
        location: String,
        timestamp: { type: Date, default: Date.now },
        remarks: String
    }],

    // Additional metadata
    estimated_delivery: Date,
    actual_delivery: Date,
    commission_amount: String,
    // API response data (for debugging/reference)
    api_response: mongoose.Schema.Types.Mixed,
    cod_remitted_date: Date,
    codRemittedStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'on-hold'],
        default: 'pending'
    },
}, {
    timestamps: true
});

shipmentSchema.pre('validate', async function (next) {
    const shipment = this;

    if (!shipment.id) {
        let unique = false;

        while (!unique) {
            // Generate a random 6-8 digit number
            const randomId = Math.floor(100000 + Math.random() * 90000000).toString();

            // Check if it already exists
            const existing = await mongoose.models.Shipment.findOne({ id: randomId }); if (!existing) {
                shipment.id = randomId;
                unique = true;
            }
        }
    }

    next();
});
// Add methods for common operations
shipmentSchema.methods.updateStatus = function (status, location, remarks) {
    this.status = status;
    this.tracking_history.push({
        status,
        location,
        timestamp: new Date(),
        remarks
    });
    return this.save();
};

shipmentSchema.methods.markDelivered = function () {
    this.status = 'Delivered';
    this.actual_delivery = new Date();
    this.tracking_history.push({
        status: 'Delivered',
        timestamp: new Date(),
        remarks: 'Package delivered successfully'
    });
    return this.save();
};

// Static method to find by order
shipmentSchema.statics.findByOrder = function (orderId) {
    return this.findOne({ order: orderId }).populate('order');
};

// Static method to find by client order id
shipmentSchema.statics.findByClientOrderId = function (clientOrderId) {
    return this.findOne({ client_order_id: clientOrderId }).populate('order');
};

// Static method to find by AWB
shipmentSchema.statics.findByAWB = function (awb) {
    return this.findOne({ awb: awb }).populate('order');
};

// Static method to find by shipment ID
shipmentSchema.statics.findByShipmentId = function (shipmentId) {
    return this.findOne({ shipment_id: shipmentId }).populate('order');
};

module.exports = mongoose.model('Shipment', shipmentSchema);