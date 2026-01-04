const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    client_order_id: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    products: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true }
        }
    ],
    shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
    hasShipment: { type: Boolean, default: false },
    paymentMethod: {
        type: String,
        enum: ['COD', 'Prepaid', 'Online Payment'],
        required: true
    },
    shippingAddress: {
        name: String,
        mobile: String,
        address: String,
        city: String,
        state: String,
        pincode: String,
        country_code: { type: String, default: 'IN' }
    },
    orderNotes: { type: String },
    totalAmount: { type: Number },
    createdAt: { type: Date, default: Date.now }
},
    {
        timestamps: true, // ✅ Adds `createdAt` and `updatedAt`
    });

// Generate unique 10-digit client_order_id before saving
orderSchema.pre('validate', async function (next) {
    if (!this.client_order_id) {
        let unique = false;
        let generatedId;
        while (!unique) {
            generatedId = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10-digit
            const existingOrder = await mongoose.models.Order.findOne({ client_order_id: generatedId });
            if (!existingOrder) unique = true;
        }
        this.client_order_id = generatedId;
    }
    next();
});


module.exports = mongoose.model('Order', orderSchema);