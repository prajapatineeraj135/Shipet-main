const User = require("../models/User");
const BillingSetting = require("../models/BillingSetting");
const PickupAddress = require("../models/PickupAddress");
const {
    addPickupAddressApi,
    updatePickupAddressApi,
} = require("../utils/icarryApi");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../utils/sendOtp");

exports.signup = async (req, res) => {
    const { firstName, lastName, email, phone, password } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60000); // 10 min

    try {
        const user = new User({
            firstName,
            lastName,
            email,
            phone,
            password,
            otp,
            otpExpires, role: 'user'
        });
        await user.save();
        await sendOtpEmail(email, otp);

        res.json({
            data: null,
            message: "OTP sent to your email. Please verify your account.",
            success: true
        });
    } catch (error) {
        res.status(500).json({
            data: null,
            message: error.message,
            success: false
        });
    }
};
// For Signup OTP verification
exports.verifySignupOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                data: null,
                message: "User not found",
                success: false
            });
        }

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({
                data: null,
                message: "Invalid or expired OTP",
                success: false
            });
        }

        user.isVerified = true;
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.json({
            data: null,
            message: "Account verified successfully.",
            success: true
        });
    } catch (error) {
        res.status(500).json({
            data: null,
            message: error.message,
            success: false
        });
    }
};
// For password reset OTP verification
exports.verifyPasswordResetOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                data: null,
                message: "User not found",
                success: false
            });
        }

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({
                data: null,
                message: "Invalid or expired OTP",
                success: false
            });
        }

        // For password reset: DON'T clear OTP yet - keep it for reset password step
        // Just verify it's valid and return success
        res.json({
            data: null,
            message: "OTP verified successfully. You can now reset your password.",
            success: true
        });
    } catch (error) {
        res.status(500).json({
            data: null,
            message: error.message,
            success: false
        });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                data: null,
                message: "User not found",
                success: false
            });
        }

        if (!user.isVerified) {
            // Resend OTP here automatically (or give them a button on UI)
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpires = new Date(Date.now() + 10 * 60000);
            user.otp = otp;
            user.otpExpires = otpExpires;
            await user.save();
            await sendOtpEmail(email, otp);

            return res.status(403).json({
                data: { requiresVerification: true },
                message: "Your account is not verified. We've sent a new OTP.",
                success: true
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({
                data: null,
                message: "Incorrect password",
                success: false
            });
        }

        const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        console.log(token)
        res.json({
            data: {
                token,
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role

                }
            },
            message: "Login successful",
            success: true
        });
    } catch (error) {
        res.status(500).json({
            data: null,
            message: error.message,
            success: false
        });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                data: null,
                message: "User not found",
                success: false
            });
        }
        if (!user.isVerified) {
            // Instead of sending reset OTP, resend signup verification OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpires = new Date(Date.now() + 10 * 60000);
            user.otp = otp;
            user.otpExpires = otpExpires;
            await user.save();
            await sendOtpEmail(email, otp);

            return res.status(403).json({
                data: { requiresVerification: true },
                message: "Your account is not verified. We've sent a verification OTP instead.",
                success: true
            });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60000);
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        await sendOtpEmail(email, otp);
        res.json({
            data: null,
            message: "OTP sent to your email for password reset.",
            success: true
        });
    } catch (error) {
        res.status(500).json({
            data: null,
            message: error.message,
            success: false
        });
    }
};

exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({
                data: null,
                message: "User not found",
                success: false,
            });
        }

        const storedOtp = user.otp?.toString().trim();
        const inputOtp = otp?.toString().trim();

        if (storedOtp !== inputOtp || user.otpExpires < new Date()) {
            return res.status(400).json({
                data: null,
                message: "Invalid or expired OTP",
                success: false,
            });
        }

        user.password = newPassword;
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.json({
            data: null,
            message: "Password reset successfully.",
            success: true,
        });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({
            data: null,
            message: "Server error",
            success: false,
        });
    }
};

exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                data: null,
                message: "User not found",
                success: false
            });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                data: null,
                message: "Incorrect current password",
                success: false
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            data: null,
            message: "Password changed successfully.",
            success: true
        });
    } catch (error) {
        res.status(500).json({
            data: null,
            message: error.message,
            success: false
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { firstName, lastName, phone } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                data: null,
                message: "User not found.",
                success: false
            });
        }
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.phone = phone || user.phone;
        await user.save();

        res.json({
            data: {
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                email: user.email
            },
            message: "Profile updated successfully.",
            success: true
        });
    } catch (error) {
        res.status(500).json({
            data: null,
            message: "Server error. Please try again later.",
            success: false
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                data: null,
                message: "Unauthorized",
                success: false
            });
        }
        const userId = req.user._id;
        const user = await User.findById(userId).select("-password -otp -otpExpires");

        if (!user) {
            return res.status(404).json({
                data: null,
                message: "User not found",
                success: false
            });
        }

        res.json({
            data: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                isVerified: user.isVerified,
                role: user.role,
                defaultPrintChoice: user.defaultPrintChoice
            },
            message: "User profile fetched successfully.",
            success: true
        });
    } catch (error) {
        res.status(500).json({
            data: null,
            message: "Internal Server Error",
            success: false
        });
    }
};

exports.logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({
        data: null,
        message: "Logged out",
        success: true
    });
}

// GET Billing Setting for a user
exports.getBillingSetting = async (req, res) => {
    try {
        const userId = req.user._id;
        let billing = await BillingSetting.findOne({ userId });

        if (!billing) {
            // Check if user has any pickup addresses
            res.status(200).json({
                success: true,
                data: {},
                message: "No settings fetched."
            });
        }

        res.status(200).json({
            success: true,
            data: billing,
            message: "Billing settings fetched."
        });
    } catch (error) {
        console.error("Error fetching billing setting:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// UPDATE or CREATE Billing Setting
exports.updateBillingSetting = async (req, res) => {
    try {
        const userId = req.user._id;
        const data = req.body;

        // Validate required fields (like pickup address)
        const requiredFields = ['name', 'email', 'phone', 'street1', 'city', 'pincode', 'zoneId'];
        const missingFields = requiredFields.filter(field => !data[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // 🔎 Find existing billing setting
        let setting = await BillingSetting.findOne({ userId });

        if (setting) {
            Object.assign(setting, data);
            await setting.save();
        } else {
            setting = await BillingSetting.create({ ...data, userId });
        }

        // 🔑 Sync Pickup Address (billing pickup)
        let pickupAddress = await PickupAddress.findOne({
            userId,
            nickname: "BillingAddress"
        });

        if (!pickupAddress) {
            // ✅ Create new pickup from billing
            pickupAddress = new PickupAddress({
                userId,
                nickname: "BillingAddress",
                name: data.name,
                email: data.email,
                phone: data.phone,
                altPhone: data.altPhone,
                street1: data.street1,
                street2: data.street2,
                locality: data.locality,
                city: data.city,
                pincode: data.pincode,
                zoneId: data.zoneId,
                isDefault: true
            });

            // Unset any previous default
            await PickupAddress.updateMany(
                { userId },
                { $set: { isDefault: false } }
            );

            // Call iCarry API for creation
            const iCarryRes = await addPickupAddressApi({
                nickname: "BillingAddress",
                name: data.name,
                email: data.email,
                phone: data.phone,
                alt_phone: data.altPhone,
                street1: data.street1,
                street2: data.street2,
                locality: data.locality,
                city: data.city,
                pincode: data.pincode,
                zone_id: data.zoneId,
                country_id: "99"
            });

            if (iCarryRes.success && iCarryRes.warehouse_id) {
                pickupAddress.warehouseId = iCarryRes.warehouse_id;
            }
            await pickupAddress.save();
        } else {
            // ✅ Update existing pickup via iCarry API
            await updatePickupAddressApi({
                warehouse_id: pickupAddress.warehouseId,
                name: data.name,
                email: data.email,
                phone: data.phone,
                alt_phone: data.altPhone,
                street1: data.street1,
                street2: data.street2,
                locality: data.locality,
                city: data.city,
                pincode: data.pincode,
                zone_id: data.zoneId,
                country_id: "99",
            });

            // Sync fields locally
            Object.assign(pickupAddress, {
                name: data.name,
                email: data.email,
                phone: data.phone,
                altPhone: data.altPhone,
                street1: data.street1,
                street2: data.street2,
                locality: data.locality,
                city: data.city,
                pincode: data.pincode,
                zoneId: data.zoneId,
                isDefault: true
            });

            await pickupAddress.save();
        }

        return res.status(200).json({
            success: true,
            message: "Billing setting & pickup address synced successfully",
            data: { setting, pickupAddress }
        });

    } catch (error) {
        console.error("Error updating billing setting:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

exports.resendOtp = async (req, res) => {
    try {
        const { email, type } = req.body
        console.log("email", email, "type", type)
        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });
        let otpToSend;

        // Check if OTP exists and is still valid
        if (user.otp && user.otpExpires > Date.now()) {
            otpToSend = user.otp; // reuse existing OTP
        } else {
            // Generate new OTP
            otpToSend = Math.floor(100000 + Math.random() * 900000).toString();
            user.otp = otpToSend;
            const otpExpires = new Date(Date.now() + 10 * 60000);
            await user.save();
        }

        // Send OTP email
        await sendOtpEmail(email, otpToSend);

        const purpose = type === "signup" ? "account verification" : "password reset";
        return res.status(200).json({ success: false, message: `OTP sent to your email for ${purpose}` });

    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.getPrintSettings = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select("defaultPrintChoice");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ success: true, data: user.defaultPrintChoice });
    } catch (error) {
        console.error("Error fetching print settings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.updatePrintSettings = async (req, res) => {
    try {
        const userId = req.user._id;
        const { choice } = req.body;
        if (!["thermal", "a4"].includes(choice)) {
            return res.status(400).json({ message: "Invalid print choice" });
        }
        // Find existing
        const user = await User.findByIdAndUpdate(
            userId,
            { defaultPrintChoice: choice },
            { new: true }
        ).select("defaultPrintChoice");
        res.json({ message: "Print settings updated", data: user.defaultPrintChoice });
    }
    catch (error) {
        console.error("Error updating print settings:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};