const Order = require("../models/Order");
const Shipment = require("../models/Shipment");
const Customer = require("../models/Customer");
const Wallet = require("../models/Wallet");
const mongoose = require('mongoose');
// Status mapping configuration
exports.getStats = async (req, res) => {
    try {
        let userId = req.user?._id;
        userId = new mongoose.Types.ObjectId(userId)
        // Get current date ranges
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const currentWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Parallelize all queries for better performance
        const [
            totalOrders,
            totalShipments,
            wallet,
            totalCustomers,
            pendingPickups,
            delivered,
            inTransit,
            outForDelivery,
            canceled,
            returned,
            revenueLastMonth,
            revenueThisMonth,
            revenueToday,
            ordersToday,
            ordersThisWeek,
            recentOrders,
            recentShipments,
            topPerformingRoutes,
            statusBreakdown
        ] = await Promise.all([
            // Basic counts
            Order.countDocuments({ userId }),
            Shipment.countDocuments({ userId, isCancelled: false }),
            Wallet.findOne({ userId }),
            Customer.countDocuments({ userId }),

            // Status-based counts
            Shipment.countDocuments({ userId, status: "25" }), // Pickup Scheduled
            Shipment.countDocuments({ userId, status: "21" }), // Delivered
            Shipment.countDocuments({ userId, status: "22" }), // In Transit
            Shipment.countDocuments({ userId, status: "26" }), // Out For Delivery
            Shipment.countDocuments({ userId, status: "7" }), // Canceled
            Shipment.countDocuments({ userId, status: "23" }), // Returned to Origin

            // Revenue calculations
            Shipment.aggregate([
                {
                    $match: {
                        userId,
                        status: "21",
                        actual_delivery: {
                            $gte: lastMonth,
                            $lt: currentMonth
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$billed_amount" }
                    }
                }
            ]),

            Shipment.aggregate([
                {
                    $match: {
                        userId,
                        status: "21",
                        actual_delivery: {
                            $gte: currentMonth,
                            $lte: now
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$billed_amount" }
                    }
                }
            ]),

            // Today's revenue
            Shipment.aggregate([
                {
                    $match: {
                        userId,
                        status: "21",
                        actual_delivery: {
                            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                            $lte: now
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$billed_amount" }
                    }
                }
            ]),

            // Orders today
            Order.countDocuments({
                userId,
                createdAt: {
                    $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
                }
            }),

            // Orders this week
            Order.countDocuments({
                userId,
                createdAt: { $gte: currentWeek }
            }),

            // Recent orders with shipment details - FIXED POPULATE AND FIELDS
            Order.find({ userId })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate({
                    path: 'shipment',
                    select: 'status billed_amount awb' // Changed tracking_id to awb
                })
                .populate({
                    path: 'customer',
                    select: 'name mobile' // Populate customer details
                })
                .select('client_order_id totalAmount createdAt shipment customer'), // Fixed field names

            // Recent shipments - FIXED FIELDS
            Shipment.find({ userId })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('awb status billed_amount consignee.city createdAt'), // Fixed field names

            // Top performing routes/destinations - FIXED FIELD NAME
            Shipment.aggregate([
                {
                    $match: {
                        userId,
                        status: "21",
                        actual_delivery: { $gte: currentMonth }
                    }
                },
                {
                    $group: {
                        _id: "$consignee.city", // Fixed field path
                        count: { $sum: 1 },
                        revenue: { $sum: "$billed_amount" }
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $limit: 5
                }
            ]),

            // Status breakdown for all shipments
            Shipment.aggregate([
                {
                    $match: { userId }
                },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        // Calculate revenue growth
        const lastMonthRevenue = revenueLastMonth[0]?.total || 0;
        const thisMonthRevenue = revenueThisMonth[0]?.total || 0;
        const todayRevenue = revenueToday[0]?.total || 0;

        const revenueGrowth = lastMonthRevenue === 0
            ? (thisMonthRevenue > 0 ? 100 : 0)
            : ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

        // Calculate success rate
        const totalDeliveryAttempts = delivered + canceled + returned;
        const successRate = totalDeliveryAttempts > 0
            ? ((delivered / totalDeliveryAttempts) * 100).toFixed(1)
            : "0.0";

        // Process status breakdown with readable names
        const processedStatusBreakdown = statusBreakdown.map(item => ({
            status: item._id || `2`,
            count: item.count
        }));
        // Process recent orders with status names - FIXED FIELD MAPPING
        const processedRecentOrders = recentOrders.map(order => ({
            _id: order._id,
            orderId: order.client_order_id, // Fixed field name
            customer_name: order.customer?.name || 'Unknown Customer', // Fixed customer reference
            customer_mobile: order.customer?.mobile || '', // Added customer mobile
            total_amount: order.totalAmount, // Fixed field name
            createdAt: order.createdAt,
            shipment: order.shipment ? {
                id: order.shipment.id,
                status: order.shipment.status,
                billed_amount: order.shipment.billed_amount,
                awb: order.shipment.awb // Fixed field name
            } : null
        }));

        // Process recent shipments with status names - FIXED FIELD MAPPING
        const processedRecentShipments = recentShipments.map(shipment => ({
            id: shipment.id,
            tracking_id: shipment.awb, // Map awb to tracking_id for frontend compatibility
            awb: shipment.awb,
            status: shipment.status,
            billed_amount: shipment.billed_amount,
            destination_city: shipment.consignee?.city || 'Unknown', // Fixed field path
            createdAt: shipment.createdAt
        }));

        const stats = {
            // Core metrics
            totalOrders,
            totalShipments,
            walletBalance: wallet?.balance || 0,
            totalCustomers,

            // Status-based metrics
            pendingPickups,
            delivered,
            inTransit,
            outForDelivery,
            canceled,
            returned,

            // Revenue metrics
            revenue: thisMonthRevenue,
            revenueGrowth: +revenueGrowth.toFixed(1),
            todayRevenue,
            lastMonthRevenue,

            // Performance metrics
            successRate: +successRate,
            ordersToday,
            ordersThisWeek,

            // Detailed data
            recentOrders: processedRecentOrders,
            recentShipments: processedRecentShipments,
            topPerformingRoutes,
            statusBreakdown: processedStatusBreakdown,

            // Additional insights
            activeShipments: inTransit + outForDelivery + pendingPickups,
            completedShipments: delivered,

            // Trends (you can expand these based on your needs)
            trends: {
                ordersGrowth: ordersThisWeek > 0 ? ((ordersToday / ordersThisWeek) * 100).toFixed(1) : "0.0",
                averageOrderValue: totalOrders > 0 ? (thisMonthRevenue / totalOrders).toFixed(2) : "0.00"
            }
        };

        res.status(200).json({
            success: true,
            message: 'Dashboard stats fetched successfully',
            data: stats,
        });

    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard stats",
            error: error.message,
        });
    }
};

// Additional helper endpoints
exports.getRevenueChart = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { period = 'month' } = req.query; // 'week', 'month', 'year'

        let dateRange;
        let groupBy;

        const now = new Date();

        switch (period) {
            case 'week':
                dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                groupBy = {
                    $dateToString: { format: "%Y-%m-%d", date: "$actual_delivery" }
                };
                break;
            case 'year':
                dateRange = new Date(now.getFullYear(), 0, 1);
                groupBy = {
                    $dateToString: { format: "%Y-%m", date: "$actual_delivery" }
                };
                break;
            default: // month
                dateRange = new Date(now.getFullYear(), now.getMonth(), 1);
                groupBy = {
                    $dateToString: { format: "%Y-%m-%d", date: "$actual_delivery" }
                };
        }

        const revenueData = await Shipment.aggregate([
            {
                $match: {
                    userId,
                    status: "21",
                    actual_delivery: { $gte: dateRange }
                }
            },
            {
                $group: {
                    _id: groupBy,
                    revenue: { $sum: "$billed_amount" },
                    orders: { $sum: 1 }
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: revenueData
        });

    } catch (error) {
        console.error("Revenue chart error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch revenue chart data",
            error: error.message,
        });
    }
};

exports.getStatusDistribution = async (req, res) => {
    try {
        const userId = req.user?._id;

        const statusData = await Shipment.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const processedData = statusData.map(item => ({
            status: item._id,
            count: item.count,
            percentage: 0 // Will be calculated on frontend
        }));

        res.status(200).json({
            success: true,
            data: processedData
        });

    } catch (error) {
        console.error("Status distribution error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch status distribution",
            error: error.message,
        });
    }
};
