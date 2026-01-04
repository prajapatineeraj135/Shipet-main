const PickupAddress = require("../models/PickupAddress");
const {
    addPickupAddressApi,
    updatePickupAddressApi,
} = require("../utils/icarryApi");

// ✅ Add Pickup Address
exports.addPickupAddress = async (req, res) => {
    try {
        const {
            nickname,
            name,
            email,
            phone,
            altPhone,
            street1,
            street2,
            locality,
            city,
            pincode,
            zoneId,
            isDefault = false,
        } = req.body;

        const count = await PickupAddress.countDocuments({ userId: req.user._id });
        if (count >= 5) {
            return res.status(400).json({
                success: false,
                message: "Maximum 5 pickup addresses allowed",
            });
        }

        // If marked as default, unset previous default
        if (isDefault) {
            await PickupAddress.updateMany(
                { userId: req.user._id },
                { $set: { isDefault: false } }
            );
        }

        // Create in local DB first
        const pickupAddress = new PickupAddress({
            userId: req.user._id,
            nickname,
            name,
            email,
            phone,
            altPhone,
            street1,
            street2,
            locality,
            city,
            pincode,
            zoneId,
            isDefault,
        });

        // Call iCarry API
        const iCarryRes = await addPickupAddressApi({
            nickname,
            name,
            email,
            phone,
            alt_phone: altPhone,
            street1,
            street2,
            locality,
            city,
            pincode,
            zone_id: zoneId,
            country_id: "99",
        });

        // Save returned warehouseId
        if (iCarryRes.success && iCarryRes.warehouse_id) {
            pickupAddress.warehouseId = iCarryRes.warehouse_id;
            await pickupAddress.save();
        }
        await pickupAddress.save();
        return res.status(201).json({
            success: true,
            message: "Pickup address created successfully",
            data: pickupAddress,
        });
    } catch (error) {
        console.error("Add Pickup Address Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create pickup address",
        });
    }
};

// ✅ Get All Pickup Addresses
exports.getAllPickupAddresses = async (req, res) => {
    try {
        const addresses = await PickupAddress.find({ userId: req.user._id }).sort({
            isDefault: -1,
            createdAt: -1,
        });

        return res.json({
            success: true,
            message: "Fetched all pickup addresses",
            data: addresses,
        });
    } catch (error) {
        console.error("Get All Pickup Addresses Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch pickup addresses",
        });
    }
};

// ✅ Get Pickup Address by ID
exports.getPickupAddressById = async (req, res) => {
    try {
        const { id } = req.params;

        const pickupAddress = await PickupAddress.findOne({
            _id: id,
            userId: req.user._id,
        });

        if (!pickupAddress) {
            return res.status(404).json({
                success: false,
                message: "Pickup address not found",
            });
        }

        return res.json({
            success: true,
            message: "Pickup address fetched",
            data: pickupAddress,
        });
    } catch (error) {
        console.error("Get Pickup Address by ID Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch pickup address",
        });
    }
};

// ✅ Update Pickup Address
exports.updatePickupAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nickname,
            name,
            email,
            phone,
            altPhone,
            street1,
            street2,
            locality,
            city,
            pincode,
            zoneId,
            isDefault = false,
        } = req.body;

        const pickupAddress = await PickupAddress.findOne({
            _id: id,
            userId: req.user._id,
        });

        if (!pickupAddress) {
            return res.status(404).json({
                success: false,
                message: "Pickup address not found",
            });
        }

        if (!pickupAddress.warehouseId) {
            return res.status(400).json({
                success: false,
                message: "warehouseId missing for update",
            });
        }

        if (isDefault) {
            await PickupAddress.updateMany(
                { userId: req.user._id },
                { $set: { isDefault: false } }
            );
        }

        // Update fields locally
        pickupAddress.nickname = nickname || pickupAddress.nickname;
        pickupAddress.name = name;
        pickupAddress.email = email;
        pickupAddress.phone = phone;
        pickupAddress.altPhone = altPhone;
        pickupAddress.street1 = street1;
        pickupAddress.street2 = street2;
        pickupAddress.locality = locality;
        pickupAddress.city = city;
        pickupAddress.pincode = pincode;
        pickupAddress.zoneId = zoneId;
        pickupAddress.isDefault = isDefault;

        // Call iCarry update API
        await updatePickupAddressApi({
            warehouse_id: pickupAddress.warehouseId,
            name,
            email,
            phone,
            alt_phone: altPhone,
            street1,
            street2,
            locality,
            city,
            pincode,
            zone_id: zoneId,
            country_id: "99",
        });
        await pickupAddress.save();
        return res.json({
            success: true,
            message: "Pickup address updated successfully",
            data: pickupAddress,
        });
    } catch (error) {
        console.error("Update Pickup Address Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update pickup address",
        });
    }
};

// ✅ Delete Pickup Address
exports.deletePickupAddress = async (req, res) => {
    try {
        const { id } = req.params;

        const pickupAddress = await PickupAddress.findOne({
            _id: id,
            userId: req.user._id,
        });

        if (!pickupAddress) {
            return res.status(404).json({
                success: false,
                message: "Pickup address not found",
            });
        }

        await pickupAddress.deleteOne();

        return res.json({
            success: true,
            message: "Pickup address deleted",
        });
    } catch (error) {
        console.error("Delete Pickup Address Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete pickup address",
        });
    }
};

// ✅ Get Pickup Address by ID
exports.getPickupAddressByWarehouseId = async (req, res) => {
    try {
        const id = req.params.id;
        const pickupAddress = await PickupAddress.findOne({
            warehouseId: Number(id),
            userId: req.user._id,
        });

        if (!pickupAddress) {
            return res.status(404).json({
                success: false,
                message: "Pickup address not found",
            });
        }

        return res.json({
            success: true,
            message: "Pickup address fetched",
            data: pickupAddress,
        });
    } catch (error) {
        console.error("Get Pickup Address by ID Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch pickup address",
        });
    }
};