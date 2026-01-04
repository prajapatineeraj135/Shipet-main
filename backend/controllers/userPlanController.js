const Plan = require('../models/Plan');
const UserPlan = require('../models/UserPlan');
const mongoose = require('mongoose');

exports.getCurrentUserPlans = async (req, res) => {
    try {
        const userId = req.user._id; // Assuming user ID comes from auth middleware

        let userPlan = await UserPlan.findOne({
            userId,
            status: 'active'
        }).sort({ createdAt: -1 });

        // If no plan found, create default Bronze plan
        if (!userPlan) {
            userPlan = new UserPlan({
                userId,
                planId: 'bronze',
                status: 'active',
                startDate: new Date()
            });
            await userPlan.save();
        }

        // Check if plan is expired
        if (userPlan.isExpired()) {
            userPlan.status = 'expired';
            await userPlan.save();

            // Create new Bronze plan
            userPlan = new UserPlan({
                userId,
                planId: 'bronze',
                status: 'active',
                startDate: new Date()
            });
            await userPlan.save();
        }

        const plan = await Plan.findOne({ id: userPlan.planId });

        res.status(200).json({
            success: true,
            data: {
                currentPlanId: userPlan.planId,
                planStartDate: userPlan.startDate,
                planEndDate: userPlan.endDate,
                planStatus: userPlan.status,
                autoRenew: userPlan.autoRenew,
                remainingDays: userPlan.getRemainingDays(),
                planDetails: plan
            },
            message: 'Current plan retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching current plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching current plan',
            error: error.message
        });
    }
}

// Upgrade user plan
exports.upgradeUserPlan = async (req, res) => {
    try {
        const userId = req.user._id;
        const { planId, paymentReference } = req.body;

        // Validate plan exists
        const newPlan = await Plan.findOne({ id: planId, isActive: true });
        if (!newPlan) {
            return res.status(404).json({
                success: false,
                message: 'Invalid plan selected'
            });
        }

        // Get current plan
        const currentUserPlan = await UserPlan.findOne({
            userId,
            status: 'active'
        });

        let previousPlanId = null;
        if (currentUserPlan) {
            // Mark current plan as cancelled
            currentUserPlan.status = 'cancelled';
            currentUserPlan.endDate = new Date();
            await currentUserPlan.save();
            previousPlanId = currentUserPlan.planId;
        }

        // Create new plan
        const newUserPlan = new UserPlan({
            userId,
            planId,
            startDate: new Date(),
            endDate: newPlan.price === 0 ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days for paid plans
            status: 'active',
            paymentReference: paymentReference || null,
            paymentStatus: newPlan.price === 0 ? null : 'completed',
            previousPlanId
        });

        await newUserPlan.save();

        res.status(200).json({
            success: true,
            data: {
                currentPlanId: newUserPlan.planId,
                planStartDate: newUserPlan.startDate,
                planEndDate: newUserPlan.endDate,
                planStatus: newUserPlan.status
            },
            message: `Successfully upgraded to ${newPlan.name} plan`
        });
    } catch (error) {
        console.error('Error upgrading plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error upgrading plan',
            error: error.message
        });
    }
}

// Get user's plan history
exports.getPlanHistory = async (req, res) => {
    try {
        const userId = req.user._id;

        const planHistory = await UserPlan.find({ userId })
            .sort({ createdAt: -1 });

        // Get plan details for each history item
        const historyWithPlans = await Promise.all(
            planHistory.map(async (userPlan) => {
                const plan = await Plan.findOne({ id: userPlan.planId });
                return {
                    ...userPlan.toObject(),
                    planDetails: plan
                };
            })
        );

        res.status(200).json({
            success: true,
            data: historyWithPlans,
            message: 'Plan history retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching plan history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching plan history',
            error: error.message
        });
    }
}
exports.checkExpiredPlans = async (req, res) => {
    try {
        const expiredPlans = await UserPlan.find({
            status: 'active',
            endDate: { $lt: new Date(), $ne: null }
        });

        for (const userPlan of expiredPlans) {
            // Mark as expired
            userPlan.status = 'expired';
            await userPlan.save();

            // Create new Bronze plan for user
            const newBronzePlan = new UserPlan({
                userId: userPlan.userId,
                planId: 'bronze',
                status: 'active',
                startDate: new Date(),
                previousPlanId: userPlan.planId
            });

            await newBronzePlan.save();

            console.log(`User ${userPlan.userId} plan expired, moved to Bronze`);
        }

        return {
            expiredCount: expiredPlans.length,
            message: `${expiredPlans.length} plans updated`
        };
    } catch (error) {
        throw new Error(`Error checking expired plans: ${error.message}`);
    }
}

// Calculate shipping rate with commission
exports.calculateShippingRate = async (req, res) => {
    try {
        const userId = req.user._id;
        const { price } = req.body;
        const parsedPrice = parseFloat(price);

        if (!parsedPrice || parsedPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid Icarry base rate is required'
            });
        }
        // Get user's current plan
        const userPlan = await UserPlan.findOne({
            userId,
            status: 'active'
        });

        const planId = userPlan ? userPlan.planId : 'bronze';
        const plan = await Plan.findOne({ id: planId });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        // Calculate final rate with commission
        const commissionAmount = (parsedPrice * plan.commissionPercentage) / 100;
        const finalRate = parsedPrice + commissionAmount;

        res.status(200).json({
            success: true,
            data: {
                baseRate: price,
                commissionPercentage: plan.commissionPercentage,
                commissionAmount: Math.round(commissionAmount * 100) / 100,
                finalRate: Math.round(finalRate * 100) / 100,
                planName: plan.name,
                discountDisplay: plan.discountDisplay
            },
            message: 'Shipping rate calculated successfully'
        });
    } catch (error) {
        console.error('Error calculating shipping rate:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating shipping rate',
            error: error.message
        });
    }
}

//admin
// exports.getPlanStatistics = async (req, res) => {
//     try {
//         const totalPlans = await Plan.countDocuments({ isActive: true });

//         const userPlanStats = await UserPlan.aggregate([
//             { $match: { status: 'active' } },
//             { $group: { _id: '$planId', count: { $sum: 1 } } },
//             { $sort: { count: -1 } }
//         ]);

//         const revenueStats = await UserPlan.aggregate([
//             {
//                 $match: {
//                     status: 'active',
//                     endDate: { $ne: null }
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'plans',
//                     localField: 'planId',
//                     foreignField: 'id',
//                     as: 'planDetails'
//                 }
//             },
//             { $unwind: '$planDetails' },
//             {
//                 $group: {
//                     _id: '$planId',
//                     totalRevenue: { $sum: '$planDetails.price' },
//                     userCount: { $sum: 1 }
//                 }
//             }
//         ]);

//         return {
//             totalPlans,
//             userPlanStats,
//             revenueStats,
//             timestamp: new Date()
//         };
//     } catch (error) {
//         throw new Error(`Error getting plan statistics: ${error.message}`);
//     }
// }

// const mongoose = require('mongoose');
// const Plan = require('../models/Plan');
// const UserPlan = require('../models/UserPlan');

exports.getPlanStatistics = async (req, res) => {
    try {
        const currentMonth = new Date();
        currentMonth.setDate(1); // first day of current month

        // 1. Total Active Plans
        const totalPlans = await Plan.countDocuments({ isActive: true });

        // 2. Plan-wise Total Users/Subscribers
        const userPlanStats = await UserPlan.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$planId', userCount: { $sum: 1 } } },
            { $sort: { userCount: -1 } }
        ]);

        // 3. Total Subscribers
        const totalSubscribers = userPlanStats.reduce((acc, stat) => acc + stat.userCount, 0);

        // 4. Monthly Revenue (only for this month)
        const monthlyRevenueStats = await UserPlan.aggregate([
            {
                $match: {
                    status: 'active',
                    startDate: { $gte: currentMonth },
                    paymentStatus: 'completed'
                }
            },
            {
                $lookup: {
                    from: 'plans',
                    localField: 'planId',
                    foreignField: 'id',
                    as: 'planDetails'
                }
            },
            { $unwind: '$planDetails' },
            {
                $group: {
                    _id: null,
                    totalMonthlyRevenue: { $sum: '$planDetails.price' },
                    monthlyUserCount: { $sum: 1 }
                }
            }
        ]);

        const monthlyRevenue = monthlyRevenueStats[0]?.totalMonthlyRevenue || 0;
        const monthlyUserCount = monthlyRevenueStats[0]?.monthlyUserCount || 0;

        // 5. Monthly Average Revenue per User
        const avgRevenuePerUser = monthlyUserCount > 0
            ? monthlyRevenue / monthlyUserCount
            : 0;

        // 6. Plan with Maximum Users
        let planWithMaxUsers = userPlanStats.length > 0 ? userPlanStats[0] : null;
        const plan = await Plan.findOne({ id: planWithMaxUsers._id, isActive: true });
        let MaxUsers = { userCount: planWithMaxUsers.userCount, name: plan.name }
        return res.status(200).json({
            success: true,
            message: "Plan Stats data",
            data: {
                totalPlans,
                userPlanStats,
                totalSubscribers,
                monthlyRevenue,
                avgRevenuePerUser: avgRevenuePerUser.toFixed(2),
                planWithMaxUsers: MaxUsers,
                timestamp: new Date()
            }
        });
    } catch (error) {
        console.error('Error in getPlanStatistics:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get plan statistics',
            error: error.message
        });
    }
};
