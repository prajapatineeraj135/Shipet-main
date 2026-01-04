const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
    signup,
    login,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    getProfile,
    verifySignupOtp,
    verifyPasswordResetOtp,
    logout,
    getBillingSetting, updateBillingSetting,
    resendOtp, getPrintSettings, updatePrintSettings, getBillingSettingById
} = require("../controllers/authController");

router.post("/signup", signup);
router.post("/verify-otp", verifySignupOtp);
router.post("/verify-reset-otp", verifyPasswordResetOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", authMiddleware, changePassword);
router.put("/update-profile", authMiddleware, updateProfile);
router.get("/profile", authMiddleware, getProfile);

// GET billing setting
router.get('/billing', authMiddleware, getBillingSetting);

// UPDATE or create billing setting
router.post('/billing', authMiddleware, updateBillingSetting);

// Get print settings
router.get("/print", authMiddleware, getPrintSettings);

// Update print settings
router.put("/print", authMiddleware, updatePrintSettings);
module.exports = router;
