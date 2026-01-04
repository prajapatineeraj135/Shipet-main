const mongoose = require("mongoose");

const pickupAddressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // iCarry Required Fields
        nickname: {
            type: String,
            required: true,
            match: [/^[A-Za-z]+$/, "Nickname must contain only alphabets and no spaces"],
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

        // Address Fields
        street1: { type: String, required: true },
        street2: { type: String },
        locality: { type: String },
        city: { type: String, required: true },
        pincode: {
            type: String,
            required: true,
            match: [/^\d{6}$/, "Pincode must be a 6-digit number"],
        },

        // Zone, Country, Warehouse (required by iCarry)
        zoneId: { type: Number, required: true },
        countryId: { type: String, default: "99" }, // Only 99 (India)
        warehouseId: { type: Number }, // Returned by iCarry after successful POST

        // Default address toggle
        isDefault: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model("PickupAddress", pickupAddressSchema);
