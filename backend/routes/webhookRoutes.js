const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

router.post('/shipment-status', webhookController.shipmentStatusWebhook);
router.post('/ndr-events', webhookController.ndrEventsWebhook);

module.exports = router;