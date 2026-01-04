const express = require('express');
const mongoose = require('mongoose');
const Shipment = require('../models/Shipment'); // Adjust path as needed

const router = express.Router();

// Webhook endpoint to receive NDR data from iCarry
exports.getNDRDataFromIcarry = async (req, res) => {
    try {
        console.log('=== NDR Webhook Received ===');
        console.log('Headers:', req.headers);
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('Raw Body:', req.body);

        let webhookData;

        // Handle different content types
        if (req.headers['content-type']?.includes('application/json')) {
            webhookData = req.body;
        } else if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
            // iCarry might send form-encoded data
            webhookData = req.body;
        } else {
            // Handle raw data
            webhookData = JSON.parse(req.body.toString());
        }

        const { client_name, callback_type, ndr_data } = webhookData;

        console.log('NDR Webhook received:', JSON.stringify(req.body, null, 2));

        if (callback_type !== 'ndr_status' || !Array.isArray(ndr_data)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid webhook data'
            });
        }

        const processedShipments = [];

        for (const ndrItem of ndr_data) {
            try {
                const { shipment_id, awb, type: ndr_event_type, date_added } = ndrItem;

                // Find shipment by AWB or shipment_id
                let shipment = await Shipment.findOne({
                    $or: [
                        { awb: awb },
                        { shipment_id: shipment_id }
                    ]
                }).populate('order');

                if (!shipment) {
                    console.log(`Shipment not found for AWB: ${awb}, shipment_id: ${shipment_id}`);
                    continue;
                }

                // Update shipment with NDR information
                shipment.status = '50';
                shipment.ndr_status = 'open';
                shipment.ndr_event_type = ndr_event_type;
                shipment.ndr_date = parseDate(date_added);
                shipment.ndr_reason = getNDRDescription(ndr_event_type);

                // Add to tracking history
                shipment.tracking_history.push({
                    status: 'NDR',
                    location: 'NDR Event',
                    timestamp: shipment.ndr_date,
                    remarks: `NDR Event: ${ndr_event_type} - ${shipment.ndr_reason}`
                });

                await shipment.save();
                processedShipments.push(shipment._id);

            } catch (error) {
                console.error(`Error processing NDR for item:`, ndrItem, error);
            }
        }

        res.json({
            success: true,
            message: `Processed ${processedShipments.length} NDR events`,
            data: processedShipments
        });

    } catch (error) {
        console.error('NDR Webhook Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}
// Get all NDR shipments with pagination and filters
exports.getNDRShipments = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status = 'all',
            search = '',
            sortBy = 'ndr_date',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {
            status: '50'
        };

        // Filter by NDR status
        if (status !== 'all') {
            query.ndr_status = status;
        }

        // Search functionality
        if (search) {
            query.$or = [
                { awb: { $regex: search, $options: 'i' } },
                { 'consignee.name': { $regex: search, $options: 'i' } },
                { 'consignee.mobile': { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [shipments, total] = await Promise.all([
            Shipment.find(query)
                .populate('order', 'order_number')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Shipment.countDocuments(query)
        ]);

        // Transform data for frontend
        const transformedShipments = shipments.map(shipment => ({
            id: shipment._id,
            awb: shipment.awb,
            shipment_id: shipment.shipment_id,
            customerName: shipment.consignee.name,
            customerPhone: shipment.consignee.mobile,
            address: shipment.consignee.address,
            city: shipment.consignee.city,
            state: shipment.consignee.state,
            pincode: shipment.consignee.pincode,
            courierName: shipment.courier_name,
            status: shipment.ndr_status || 'open',
            ndrEventType: shipment.ndr_event_type,
            ndrReason: shipment.ndr_reason,
            lastAttemptDate: formatDate(shipment.ndr_date),
            nextAttemptDate: shipment.ndr_next_attempt_date ? formatDate(shipment.ndr_next_attempt_date) : null,
            remarks: shipment.ndr_remarks || '',
            orderNumber: shipment.order?.order_number
        }));

        res.json({
            success: true,
            data: transformedShipments,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching NDR shipments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch NDR shipments'
        });
    }
}

// Get NDR statistics
exports.getNDRStats = async (req, res) => {
    try {
        const stats = await Shipment.aggregate([
            {
                $match: { status: '50' }
            },
            {
                $group: {
                    _id: '$ndr_status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const result = {
            total: 0,
            open: 0,
            closed: 0,
            reattempt_scheduled: 0
        };

        stats.forEach(stat => {
            result.total += stat.count;
            if (stat._id) {
                result[stat._id] = stat.count;
            }
        });

        res.json({
            success: true,
            message: 'Successfully Fetch NDR statistics',
            data: result
        });

    } catch (error) {
        console.error('Error fetching NDR stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch NDR statistics'
        });
    }
}

// Take action on NDR shipment
exports.takeAction = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, remarks, scheduledDate } = req.body;

        const shipment = await Shipment.findById(id);
        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: 'Shipment not found'
            });
        }

        let newStatus = shipment.ndr_status;
        let trackingRemarks = remarks || '';

        switch (action) {
            case 'reattempt':
                newStatus = 'reattempt_scheduled';
                if (scheduledDate) {
                    shipment.ndr_next_attempt_date = new Date(scheduledDate);
                    trackingRemarks += ` - Scheduled for ${scheduledDate}`;
                }
                break;

            case 'return_to_origin':
                newStatus = 'closed';
                shipment.status = 'RTO';
                trackingRemarks = 'Return to Origin initiated' + (remarks ? ` - ${remarks}` : '');
                break;

            case 'mark_delivered':
                newStatus = 'closed';
                shipment.status = 'Delivered';
                shipment.actual_delivery = new Date();
                trackingRemarks = 'Marked as delivered' + (remarks ? ` - ${remarks}` : '');
                break;

            case 'cancel':
                newStatus = 'closed';
                shipment.status = 'Cancelled';
                shipment.isCancelled = true;
                shipment.cancelledAt = new Date();
                trackingRemarks = 'Shipment cancelled' + (remarks ? ` - ${remarks}` : '');
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action'
                });
        }

        // Update shipment
        shipment.ndr_status = newStatus;
        shipment.ndr_remarks = remarks;

        // Add tracking history
        shipment.tracking_history.push({
            status: action.toUpperCase(),
            location: 'NDR Action',
            timestamp: new Date(),
            remarks: trackingRemarks
        });

        await shipment.save();

        // Transform for response
        const transformedShipment = {
            id: shipment._id,
            awb: shipment.awb,
            customerName: shipment.consignee.name,
            customerPhone: shipment.consignee.mobile,
            city: shipment.consignee.city,
            state: shipment.consignee.state,
            pincode: shipment.consignee.pincode,
            courierName: shipment.courier_name,
            status: shipment.ndr_status,
            ndrEventType: shipment.ndr_event_type,
            ndrReason: shipment.ndr_reason,
            lastAttemptDate: formatDate(shipment.ndr_date),
            nextAttemptDate: shipment.ndr_next_attempt_date ? formatDate(shipment.ndr_next_attempt_date) : null,
            remarks: shipment.ndr_remarks || ''
        };

        res.json({
            success: true,
            message: `Action ${action} completed successfully`,
            data: transformedShipment
        });

    } catch (error) {
        console.error('Error taking NDR action:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to take action'
        });
    }
}
// Utility functions
function parseDate(dateString) {
    // Parse date format: "23/01/2025"
    const [day, month, year] = dateString.split('/');
    return new Date(year, month - 1, day);
}

function formatDate(date) {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function getNDRDescription(eventType) {
    const descriptions = {
        "REATTEMPT-CONTACT": "Consignee address incomplete/wrong or not reachable",
        "REATTEMPT": "Delivery attempt failed",
        "MISROUTE": "Shipment is in wrong delivery pincode",
        "DC-ADDRESS": "Delivery address is ODA - self collection required",
        "URGENT-DELIVERY": "Delivery detected as beyond EDD",
        "REATTEMPT-COD-NOT-READY": "Consignee did not have COD amount ready",
        "RTO-MISSING": "Shipment is missing while in return",
        "OPEN-DELIVERY": "Consignee asked for open delivery",
        "CONSIGNEE-OPENED": "Consignee opened parcel and refused delivery",
        "REFUSED": "Consignee refused to accept shipment",
        "RTO-REATTEMPT": "Return shipment delivery attempt failed",
        "REATTEMPT-NEW-DATE": "Consignee asked for future delivery date",
        "REATTEMPT-RESTRICTED": "Address entry restricted",
        "ENTRY": "Entry restriction issue",
        "RTO-PACKING": "Return shipment packing issue",
        "REATTEMPT-CUST-REFUSED": "Customer refused shipment",
        "REATTEMPT-OTP": "Consignee did not have OTP",
        "MANUAL-VERIFY": "Manual verification needed",
        "RTO-SECURITY": "Returned due to security reasons",
        "FINANCE-EMBARGO": "Held due to payment issue",
        "EWAY-SEND": "Pending E-Way bill information",
        "REATTEMPT-DAMAGE": "Shipment is damaged",
        "REATTEMPT-RTO-REFUSED": "Return shipment refused by shipper",
        "REATTEMPT-OUTOFSTN": "Consignee not at delivery address"
    };

    return descriptions[eventType] || eventType;
}
