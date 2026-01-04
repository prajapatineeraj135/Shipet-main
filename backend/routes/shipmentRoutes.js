const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

// Book shipments
router.post('/book/single', shipmentController.bookSingleShipment);
router.post('/book/multi-box', shipmentController.bookMultiBoxShipment);
router.post('/book/international', shipmentController.bookInternationalShipment);


//getbyawb
router.get('/search', shipmentController.getShipmentByAwb);

// Get shipments
router.get('/', shipmentController.getSyncedDataShipments);
router.get('/:id', shipmentController.getShipmentDetails);

// Track and manage shipments
router.get('/track/:id', shipmentController.trackShipment);
router.patch('/sync-status', shipmentController.syncShipmentStatus);
router.patch('/sync-billing', shipmentController.syncShipmentBilling);

// Print labels
router.post('/print-label', shipmentController.printShipmentLabel);
router.post('/print-multiple-label', shipmentController.printMultipleShipmentLabels);

// Legacy routes for compatibility (if needed)
router.get('/filter', shipmentController.getFilteredShipments);
// router.get('/search', shipmentController.getORFilteredShipments);

// Cancel order
router.post('/cancel', shipmentController.cancelShipment);

// Reverse order
router.post('/reverse', shipmentController.reverseShipment);

module.exports = router;