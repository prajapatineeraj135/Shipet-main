const User = require('../models/User');
const Shipment = require('../models/Shipment');
const Order = require('../models/Order');
const Product = require('../models/Product');
const WalletTransaction = require('../models/WalletTransaction');
const Wallet = require('../models/Wallet');
const Customer = require('../models/Customer');
const UserPlan = require('../models/UserPlan');
const Plan = require('../models/Plan');
const HelpDeskTicket = require('../models/HelpDeskTicket');
const PayoutSummary = require('../models/PayoutSummary');
const BillingSetting = require('../models/BillingSetting');
const mongoose = require("mongoose");
const { generateTransactionId } = require('../utils/helpers');

//user-page
exports.updateTicketStatus = async (req, res) => {
    try {
        const { ticketId, status } = req.body;

        if (!ticketId || !status) {
            return res.status(400).json({
                success: false,
                message: 'Ticket ID and status are required'
            });
        }

        if (!['open', 'closed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be open, unresolved, or closed'
            });
        }

        const ticket = await HelpDeskTicket.findOne({
            $or: [{ ticketId: ticketId }, { ticketId }]
        });

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        ticket.status = status;
        if (status === 'closed' && !ticket.closedAt) {
            ticket.closedAt = new Date();
        } else if (status !== 'closed') {
            ticket.closedAt = undefined;
        }

        await ticket.save();

        res.json({
            success: true,
            message: 'Ticket status updated successfully',
            data: ticket
        });
    } catch (err) {
        console.error('Admin updateTicketStatus error:', err);
        res.status(500).json({ success: false, message: 'Failed to update ticket status' });
    }
};

// ✅ GET user by ID with basic details only
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id)
            .populate("wallet", "balance") // Only get wallet balance
            .select("-password -otp -otpExpires"); // hide sensitive fields

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Get basic counts without full data
        const [customerCount, orderCount, productCount, shipmentCount, transactionCount] = await Promise.all([
            Customer.countDocuments({ userId: id }),
            Order.countDocuments({ userId: id }),
            Product.countDocuments({ userId: id }),
            Shipment.countDocuments({ userId: id }),
            WalletTransaction.countDocuments({ userId: id })
        ]);

        const userBasicData = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            wallet: user.wallet,
            counts: {
                customers: customerCount,
                orders: orderCount,
                products: productCount,
                shipments: shipmentCount,
                transactions: transactionCount
            }
        };

        res.status(200).json({ success: true, data: userBasicData });
    } catch (error) {
        console.error("❌ Error fetching user:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ✅ GET all users with basic info for listing
exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "", role = "" } = req.query;

        const query = {};

        // Search by name or email
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by role
        if (role) {
            query.role = role;
        }

        const users = await User.find(query)
            .populate("wallet", "balance")
            .select("-password -otp -otpExpires")
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        // Get basic counts for each user
        const usersWithCounts = await Promise.all(
            users.map(async (user) => {
                const [customerCount, orderCount, shipmentCount] = await Promise.all([
                    Customer.countDocuments({ userId: user._id }),
                    Order.countDocuments({ userId: user._id }),
                    Shipment.countDocuments({ userId: user._id })
                ]);

                return {
                    _id: user._id,
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    isVerified: user.isVerified,
                    walletBalance: user.wallet?.balance || 0,
                    createdAt: user.createdAt,
                    counts: {
                        customers: customerCount,
                        orders: orderCount,
                        shipments: shipmentCount
                    }
                };
            })
        );

        res.status(200).json({
            success: true,
            data: {
                users: usersWithCounts,
                pagination: {
                    current: parseInt(page),
                    total: Math.ceil(total / limit),
                    count: users.length,
                    totalUsers: total
                }
            }
        });
    } catch (error) {
        console.error("❌ Error fetching users:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ✅ DELETE user by ID (Admin only)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Prevent deletion of admin users by non-super-admin
        if (user.role === 'admin' && req.user.role !== 'super-admin') {
            return res.status(403).json({
                success: false,
                message: "Cannot delete admin users"
            });
        }

        // Delete user and all related data
        await Promise.all([
            User.findByIdAndDelete(id),
            Wallet.deleteOne({ userId: id }),
            WalletTransaction.deleteMany({ userId: id }),
            Customer.deleteMany({ userId: id }),
            Order.deleteMany({ userId: id }),
            Product.deleteMany({ userId: id }),
            Shipment.deleteMany({ userId: id })
        ]);

        res.status(200).json({
            success: true,
            message: `User ${user.firstName} ${user.lastName} deleted successfully`
        });
    } catch (error) {
        console.error("❌ Error deleting user:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ✅ UPDATE user status (Admin only)
exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isVerified, role } = req.body;

        const updateData = {};
        if (typeof isVerified === 'boolean') {
            updateData.isVerified = isVerified;
        }
        if (role && ['user', 'admin', 'support'].includes(role)) {
            updateData.role = role;
        }

        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select("-password -otp -otpExpires");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: user
        });
    } catch (error) {
        console.error("❌ Error updating user:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ✅ EDIT user by ID (Admin only)
exports.updateUserById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(req.body)
        const { firstName, lastName, email, phone } = req.body;

        let user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // ✅ Allow only name, email, phone updates
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email.toLowerCase().trim();
        if (phone) user.phone = phone;

        await user.save();

        res.status(200).json({
            success: true,
            message: `User ${user.firstName} ${user.lastName} updated successfully`,
            data: user
        });
    } catch (error) {
        console.error("❌ Error updating user:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

async function generateUniquePayoutId() {
    let payoutId;
    let exists = true;

    while (exists) {
        payoutId = Math.floor(1000000 + Math.random() * 9000000); // 7-digit
        exists = await PayoutSummary.exists({ payoutId }); // check in DB
    }

    return payoutId;
}
module.exports.createPayout = async (req, res) => {
    try {
        const { userId, shipmentIds, payoutReference, utrNumber } = req.body;
        console.log('Creating payout for userId:', userId, 'shipmentIds:', shipmentIds);

        // Validate required fields
        if (!userId || !shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'userId and shipmentIds array are required'
            });
        }

        // Find user's billing settings to get payment method
        const billingSetting = await BillingSetting.findOne({ userId });
        console.log('Billing setting:', billingSetting);

        if (!billingSetting || !billingSetting.codRemittancePaymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'User billing settings or COD remittance payment method not found'
            });
        }

        // Find all shipments and calculate total amount
        const shipments = await Shipment.find({
            _id: { $in: shipmentIds },
            userId: userId,
            'parcel.type': 'COD',
            codRemittedStatus: 'pending'
        });

        if (shipments.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No eligible COD shipments found for payout'
            });
        }

        // Calculate total payout amount
        const totalPayoutAmount = shipments.reduce((total, shipment) => {
            return total + (shipment.parcel.value || 0);
        }, 0);

        // Generate unique payout ID
        const payoutId = await generateUniquePayoutId();

        // Create payout summary
        const payoutSummary = new PayoutSummary({
            payoutId,
            userId,
            totalPayoutAmount,
            paidOn: new Date(),
            payoutMethodType: billingSetting.codRemittancePaymentMethod,
            payoutReference,
            utrNumber,
            shipmentIds: shipments.map(s => s._id)
        });

        await payoutSummary.save();

        // Update each shipment's COD remittance status and date
        await Shipment.updateMany(
            { _id: { $in: shipments.map(s => s._id) } },
            {
                $set: {
                    cod_remitted_date: new Date(),
                    codRemittedStatus: 'completed'
                }
            }
        );

        // Populate the payout summary for response
        const populatedPayout = await PayoutSummary.findById(payoutSummary._id)
            .populate('userId', 'firstName lastName email')
            .populate({
                path: 'shipmentIds',
                select: 'shipment_id awb client_order_id parcel.value status',
                populate: {
                    path: 'order',
                    select: 'client_order_id'
                }
            });

        return res.status(201).json({
            success: true,
            message: 'Payout created successfully',
            data: {
                payoutSummary: populatedPayout
            }
        });

    } catch (error) {
        console.error('Error creating payout:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports.getAllPayoutSummaries = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.body;

        // Build filter
        const filter = {};

        // Get paginated payout summaries
        const payoutSummaries = await PayoutSummary.find(filter)
            .populate('userId', 'firstName lastName email phone')
            .populate({
                path: 'shipmentIds',
                select: 'shipment_id id awb client_order_id parcel.value parcel.type status cod_remitted_date codRemittedStatus',
                populate: {
                    path: 'order',
                    select: 'client_order_id'
                }
            })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await PayoutSummary.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: {
                payoutSummaries,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Error fetching payout summaries:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports.getPendingCODShipmentsForUser = async (req, res) => {
    try {
        const { page = 1, limit = 50, userId } = req.body;

        console.log('Getting pending COD shipments for userId:', userId);

        // Build match criteria
        let matchCriteria = {
            'parcel.type': 'COD',
            codRemittedStatus: 'pending', // not paid
            status: '21' // delivered
        };

        // If userId is provided, filter by specific user
        if (userId) {
            matchCriteria.userId = new mongoose.Types.ObjectId(userId);
        }

        const skip = (page - 1) * limit;

        // Get shipments with proper projection
        const shipments = await Shipment.aggregate([
            { $match: matchCriteria },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    id: 1,
                    shipment_id: 1,
                    awb: 1,
                    client_order_id: 1,
                    parcel_value: '$parcel.value',
                    status: 1,
                    consignee_name: '$consignee.name',
                    consignee_city: '$consignee.city',
                    actual_delivery: 1,
                    createdAt: 1,
                    userId: 1,
                    'user.firstName': 1,
                    'user.lastName': 1,
                    'user.email': 1,
                    'user.phone': 1
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ]);

        const total = await Shipment.countDocuments(matchCriteria);

        return res.status(200).json({
            success: true,
            data: {
                shipments,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Error fetching pending COD shipments:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports.adminWalletCredits = async (req, res) => {
    try {
        const { userId, amount, paymentMethod = 'admin_credit', reference, notes } = req.body;

        // Validation
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        if (amount < 1) {
            return res.status(400).json({
                success: false,
                message: 'Minimum credit amount is ₹1'
            });
        }

        if (amount > 1000000) {
            return res.status(400).json({
                success: false,
                message: 'Maximum credit amount is ₹10,00,000'
            });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Find or create wallet
        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            wallet = await Wallet.create({ userId, balance: 0 });
        }

        const transactionReference = reference || generateTransactionId('WC'); // Admin Credit

        // Create wallet transaction
        const transaction = await WalletTransaction.create({
            userId,
            type: 'credit',
            amount,
            description: `${notes || 'COD Payout'}`,
            reference: transactionReference,
            status: 'completed',
            paymentMethod,
            completedAt: new Date(),
            metadata: {
                rechargeType: 'payout',
                paymentMethod,
                notes: notes || 'COD Payout credit by admin'
            }
        });

        // Update wallet balance
        wallet.balance += amount;
        wallet.lastRechargeAt = new Date();
        await wallet.save();

        // Populate user details in response
        const populatedTransaction = await WalletTransaction.findById(transaction._id)
            .populate('userId', 'firstName lastName email phone');

        res.json({
            success: true,
            message: 'Wallet credited successfully',
            data: {
                transaction: populatedTransaction,
                newBalance: wallet.balance,
                user: {
                    id: user._id,
                    name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                    email: user.email
                }
            }
        });

    } catch (error) {
        console.error('Admin wallet credit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to credit wallet',
            error: error.message
        });
    }
};

exports.getBillingSettingById = async (req, res) => {
    try {
        const { userId } = req.params; // Get userId from URL params
        console.log("userId", userId);

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        let billing = await BillingSetting.findOne({ userId });
        console.log("billing", billing);

        if (!billing) {
            return res.status(200).json({
                success: true,
                data: null,
                message: "No billing settings found for this user."
            });
        }

        res.status(200).json({
            success: true,
            data: billing,
            message: "Billing settings fetched successfully."
        });
    } catch (error) {
        console.error("Error fetching billing setting:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};