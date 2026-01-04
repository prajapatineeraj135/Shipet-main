const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Define schema
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    otp: String,
    otpExpires: Date,
    isVerified: { type: Boolean, default: false },
    role: {
        type: String,
        enum: ['user', 'admin', 'support'], // restrict values to user or admin
        default: 'user'          // default is a normal user
    },

    defaultPrintChoice: {
        type: String,
        enum: ["thermal", "a4"],
        default: 'thermal'
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


// ✅ Pre-save hook to hash password
userSchema.pre("save", async function (next) {
    console.log("⚠️ Saving user:", this.email);
    console.log("OTP Before Save:", this.otp);
    console.log("OTP Expires Before Save:", this.otpExpires);

    if (this.isModified("password")) {
        console.log("🔐 Password was modified");
        this.password = await bcrypt.hash(this.password, 10);
    }

    next();
});


// ✅ Compare password method
userSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.password);
};


// ✅ Virtual for wallet (1:1)
userSchema.virtual('wallet', {
    ref: 'Wallet',
    localField: '_id',
    foreignField: 'userId',
    justOne: true
});

// ✅ Virtual for wallet transactions (1:many)
userSchema.virtual('walletTransactions', {
    ref: 'WalletTransaction',
    localField: '_id',
    foreignField: 'userId'
});

// ✅ NEW: Virtual for user's customers
userSchema.virtual('customers', {
    ref: 'Customer',
    localField: '_id',
    foreignField: 'userId'
});

// ✅ NEW: Virtual for user's orders
userSchema.virtual('orders', {
    ref: 'Order',
    localField: '_id',
    foreignField: 'userId'
});

// ✅ NEW: Virtual for user's products
userSchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'userId'
});

// ✅ NEW: Virtual for user's shipments
userSchema.virtual('shipments', {
    ref: 'Shipment',
    localField: '_id',
    foreignField: 'userId'
});

// ✅ Auto-create wallet when user is created
userSchema.post('save', async function (doc, next) {
    try {
        const Wallet = require('./Wallet');
        const existingWallet = await Wallet.findOne({ userId: doc._id });
        if (!existingWallet) {
            await Wallet.create({ userId: doc._id });
            console.log("💰 Wallet created for user:", doc.email);
        }
    } catch (error) {
        console.error("❌ Error creating wallet:", error);
    }
    next();
});

module.exports = mongoose.model("User", userSchema);
