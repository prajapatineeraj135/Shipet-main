const { checkPincodeApi } = require("../utils/icarryApi"); // ✅ Use centralized utility

exports.checkPincode = async (req, res) => {

    const { pincode } = req.body;

    if (!pincode) {
        return res.status(400).json({
            success: false,
            message: "Pincode is required",
            error: "Missing pincode in request body",
        });
    }

    try {
        const response = await checkPincodeApi({ pincode });
        if (response.success)
            res.status(200).json({
                success: true,
                message: "Pincode serviceability checked successfully",
                data: response?.msg,
            });
    } catch (error) {
        console.error("Pincode Check Error:", error.message);
        res.status(400).json({
            success: false,
            message: "Failed to check pincode serviceability",
            error: error.message,
        });
    }
};
