const express = require("express");
const router = express.Router();
const shipmentEstimateController = require("../controllers/shipmentCostEstimateController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/single", authMiddleware, shipmentEstimateController.getSingleShipmentEstimate);
router.post("/multi-box", authMiddleware, shipmentEstimateController.getMultiShipmentEstimate);
router.post("/international", authMiddleware, shipmentEstimateController.getInternationalShipmentEstimate);

module.exports = router;
