const PayoutSummary = require('../models/PayoutSummary');
const Shipment = require('../models/Shipment');
const mongoose = require("mongoose");

// Get all COD shipments for user portal
exports.getUserCODShipments = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, status, search } = req.query;

        let query = {
            userId,
            'parcel.type': 'COD',
            isCancelled: false,
        };

        // Filter by status if provided
        if (status && status !== 'all') {
            query.codRemittedStatus = status;
        }

        // Search functionality
        if (search) {
            query.$or = [
                { id: { $regex: search, $options: 'i' } },
                { awb: { $regex: search, $options: 'i' } },
                { client_order_id: { $regex: search, $options: 'i' } },
                { 'consignee.name': { $regex: search, $options: 'i' } },
                { 'consignee.mobile': { $regex: search, $options: 'i' } },
            ];
        }

        const shipments = await Shipment.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('order', 'order_id')
            .select('id awb client_order_id parcel status codRemittedStatus cod_remitted_date consignee createdAt actual_delivery');

        const totalShipments = await Shipment.countDocuments(query);

        // Calculate pending COD amount
        const pendingCODAmount = await Shipment.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    'parcel.type': 'COD',
                    isCancelled: false,
                    status: { $in: ['21'] },
                    codRemittedStatus: 'pending'
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$parcel.value' }
                }
            }
        ]);

        const pendingAmount = pendingCODAmount.length > 0 ? pendingCODAmount[0].totalAmount : 0;

        res.json({
            success: true,
            data: {
                shipments,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalShipments / limit),
                    totalItems: totalShipments,
                    hasNext: page < Math.ceil(totalShipments / limit),
                    hasPrev: page > 1,
                },
                summary: {
                    totalPendingCOD: pendingAmount,
                    settlementCycle: 'T+7 days',
                },
            },
        });
    } catch (error) {
        console.error('Error fetching COD shipments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch COD shipments',
            error: error.message,
        });
    }
};

// Get all payout summaries for user (remittances)
exports.getUserPayoutSummaries = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, search } = req.query;

        let query = { userId };

        // Search by payoutId, reference, or UTR
        if (search) {
            query.$or = [
                { payoutId: { $regex: search, $options: 'i' } },
                { payoutReference: { $regex: search, $options: 'i' } },
                { utrNumber: { $regex: search, $options: 'i' } },
            ];
        }

        const payoutSummaries = await PayoutSummary.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('payoutId totalPayoutAmount paidOn payoutMethodType payoutReference utrNumber createdAt');

        const totalPayouts = await PayoutSummary.countDocuments(query);

        // Get summary statistics
        const summaryStats = await PayoutSummary.aggregate([
            {
                $match: { userId: new mongoose.Types.ObjectId(userId) }
            },
            {
                $group: {
                    _id: null,
                    totalRemitted: { $sum: '$totalPayoutAmount' },
                    totalPayouts: { $sum: 1 },
                    lastPayout: { $max: '$paidOn' }
                }
            }
        ]);

        const stats = summaryStats.length > 0 ? summaryStats[0] : {
            totalRemitted: 0,
            totalPayouts: 0,
            lastPayout: null
        };

        res.json({
            success: true,
            data: {
                payoutSummaries,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalPayouts / limit),
                    totalItems: totalPayouts,
                    hasNext: page < Math.ceil(totalPayouts / limit),
                    hasPrev: page > 1,
                },
                summary: {
                    totalRemitted: stats.totalRemitted,
                    totalPayouts: stats.totalPayouts,
                    lastPayout: stats.lastPayout,
                },
            },
        });

    } catch (error) {
        console.error('Error fetching payout summaries:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payout summaries',
            error: error.message,
        });
    }
};

// Get detailed payout summary with all attached shipments
exports.getPayoutSummaryDetails = async (req, res) => {
    try {
        const userId = req.user._id;
        const { payoutId } = req.params;

        // Find the payout summary and verify it belongs to the user
        const payoutSummary = await PayoutSummary.findOne({
            payoutId,
            userId
        }).populate({
            path: 'shipmentIds',
            select: 'shipment_id awb client_order_id parcel status cod_remitted_date consignee actual_delivery createdAt',
            populate: {
                path: 'order',
                select: 'order_id'
            }
        });

        if (!payoutSummary) {
            return res.status(404).json({
                success: false,
                message: 'Payout summary not found',
            });
        }

        // Format the response with shipment details
        const shipmentDetails = payoutSummary.shipmentIds.map(shipment => ({
            _id: shipment._id,
            shipment_id: shipment.shipment_id,
            awb: shipment.awb,
            client_order_id: shipment.client_order_id,
            order_id: shipment.order?.order_id,
            amount: shipment.parcel.value,
            consignee: {
                name: shipment.consignee.name,
                city: shipment.consignee.city,
                mobile: shipment.consignee.mobile
            },
            status: shipment.status,
            cod_remitted_date: shipment.cod_remitted_date,
            actual_delivery: shipment.actual_delivery,
            createdAt: shipment.createdAt
        }));

        res.json({
            success: true,
            data: {
                payoutSummary: {
                    payoutId: payoutSummary.payoutId,
                    totalPayoutAmount: payoutSummary.totalPayoutAmount,
                    paidOn: payoutSummary.paidOn,
                    payoutMethodType: payoutSummary.payoutMethodType,
                    payoutReference: payoutSummary.payoutReference,
                    utrNumber: payoutSummary.utrNumber,
                    createdAt: payoutSummary.createdAt,
                    totalShipments: shipmentDetails.length
                },
                shipments: shipmentDetails
            },
        });

    } catch (error) {
        console.error('Error fetching payout summary details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payout summary details',
            error: error.message,
        });
    }
};