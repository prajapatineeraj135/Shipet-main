const Shipment = require('../models/Shipment');
const Order = require('../models/Order');

// Shipment Status Webhook (sync_status)
exports.shipmentStatusWebhook = async (req, res) => {
    try {
        const { callback_type, id, status } = req.body;

        if (callback_type !== 'sync_status') {
            return res.status(400).json({ error: 'Invalid callback type' });
        }

        // Find Shipment by AWB
        const shipment = await Shipment.findOne({ id });
        if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

        // Update Shipment Status
        shipment.status = status;
        await shipment.save();
        res.json({
            success: true,
            message: 'Shipment status updated successfully',
            data: shipment
        });
    } catch (err) {
        console.error('Shipment Webhook Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// NDR Events Webhook (ndr_status)
exports.ndrEventsWebhook = async (req, res) => {
    try {
        const { callback_type, ndr_data } = req.body;

        if (callback_type !== 'ndr_status') {
            return res.status(400).json({ error: 'Invalid callback type' });
        }

        console.log('Received NDR Events:', ndr_data);
        res.json({
            success: true,
            message: 'NDR events received successfully',
            data: ndr_data
        });
    } catch (err) {
        console.error('NDR Webhook Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
