const {
    estimateSingleShipmentApi,
    estimateMultiBoxShipmentApi,
    estimateInternationalShipmentApi,
} = require("../utils/icarryApi"); // ✅ Use centralized utility

// ✅ Single Shipment Estimate
exports.getSingleShipmentEstimate = async (req, res) => {
    try {
        const result = await estimateSingleShipmentApi(req.body);

        res.status(201).json({
            success: true,
            message: 'Single shipment estimate fetched successfully',
            data: result?.estimate,
        });
    } catch (error) {
        console.error("Single Shipment Estimate Error:", error.message);
        res.status(400).json({
            success: false,
            message: 'Failed to fetch single shipment estimate',
            error: error.message,
        });
    }
};

// ✅ Multi-Box Shipment Estimate
exports.getMultiShipmentEstimate = async (req, res) => {
    try {
        const result = await estimateMultiBoxShipmentApi(req.body);

        res.status(201).json({
            success: true,
            message: 'Multi-box shipment estimate fetched successfully',
            data: result.estimate,
        });
    } catch (error) {
        console.error("Multi-Box Shipment Estimate Error:", error.message);
        res.status(400).json({
            success: false,
            message: 'Failed to fetch multi-box shipment estimate',
            error: error.message,
        });
    }
};

// ✅ International Shipment Estimate
exports.getInternationalShipmentEstimate = async (req, res) => {
    try {
        const result = await estimateInternationalShipmentApi(req.body);

        res.status(201).json({
            success: true,
            message: 'International shipment estimate fetched successfully',
            data: result.estimates,
        });
    } catch (error) {
        console.error("International Shipment Estimate Error:", error.message);
        res.status(400).json({
            success: false,
            message: 'Failed to fetch international shipment estimate',
            error: error.message,
        });
    }
};
