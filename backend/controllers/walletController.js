// controllers/walletController.js
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');
const { generateTransactionId } = require('../utils/helpers');
const Shipment = require('../models/Shipment');
const BillingSetting = require('../models/BillingSetting');
const crypto = require("crypto");


// Helper method to generate CSV
const generateCSV = (transactions) => {
    const headers = ['Date', 'Type', 'Amount', 'Description', 'Reference', 'Status', 'Order ID'];
    const rows = transactions.map(t => [
        new Date(t.createdAt).toLocaleDateString(),
        t.type,
        t.amount,
        t.description,
        t.reference,
        t.status,
        t.orderId || ''
    ]);

    return [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
};

// Get wallet stats for dashboard
const getWalletStats = async (req, res) => {
    try {
        const userId = req.user._id;
        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            wallet = await Wallet.create({ userId, balance: 0 });
        }

        const transactions = await WalletTransaction.find({ userId });

        const totalCredits = transactions
            .filter(t => t.type === 'credit' && t.status === 'completed')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalDebits = transactions
            .filter(t => t.type === 'debit' && t.status === 'completed')
            .reduce((sum, t) => sum + t.amount, 0);

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlySpend = transactions
            .filter(t => {
                const transactionDate = new Date(t.createdAt);
                return t.type === 'debit' &&
                    t.status === 'completed' &&
                    transactionDate.getMonth() === currentMonth &&
                    transactionDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        const pendingAmount = transactions
            .filter(t => t.status === 'pending')
            .reduce((sum, t) => t.type === 'credit' ? sum + t.amount : sum - t.amount, 0);

        res.json({
            success: true,
            data: {
                balance: wallet.balance,
                totalCredits,
                totalDebits,
                monthlySpend,
                pendingAmount
            }
        });
    } catch (error) {
        console.error('Get wallet stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch wallet stats'
        });
    }
};

// Get wallet transactions with filters
const getTransactions = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 50, type, status, month, search } = req.query;

        const filter = { userId };

        if (type && type !== 'all') filter.type = type;
        if (status && status !== 'all') filter.status = status;

        if (month && month !== 'all') {
            const monthNum = parseInt(month);
            const year = new Date().getFullYear();
            const startDate = new Date(year, monthNum, 1);
            const endDate = new Date(year, monthNum + 1, 0);
            filter.createdAt = { $gte: startDate, $lte: endDate };
        }

        if (search) {
            filter.$or = [
                { description: { $regex: search, $options: 'i' } },
                { reference: { $regex: search, $options: 'i' } },
                { orderId: { $regex: search, $options: 'i' } }
            ];
        }

        const transactions = await WalletTransaction.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await WalletTransaction.countDocuments(filter);

        res.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    current: parseInt(page),
                    total: Math.ceil(total / limit),
                    count: transactions.length,
                    totalRecords: total
                }
            }
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transactions'
        });
    }
};

// Recharge wallet
const rechargeWallet = async (req, res) => {
    try {
        const userId = req.user._id;
        const { amount, paymentMethod = 'online', orderId } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }
        if (amount < 100) {
            return res.status(400).json({ success: false, message: 'Minimum recharge amount is ₹100' });
        }
        if (amount > 100000) {
            return res.status(400).json({ success: false, message: 'Maximum recharge amount is ₹1,00,000' });
        }

        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            wallet = await Wallet.create({ userId, balance: 0 });
        }

        const reference = generateTransactionId('WR');

        const transaction = await WalletTransaction.create({
            userId,
            type: 'credit',
            amount,
            description: `Wallet recharge via ${paymentMethod}`,
            reference,
            orderId: orderId || null,
            status: 'pending',
            paymentMethod,
            metadata: { rechargeType: 'manual', paymentMethod }
        });

        wallet.balance += amount;
        wallet.lastRechargeAt = new Date();
        await wallet.save();

        transaction.status = 'completed';
        transaction.completedAt = new Date();
        await transaction.save();

        res.json({
            success: true,
            message: 'Wallet recharged successfully',
            data: { transaction, newBalance: wallet.balance }
        });
    } catch (error) {
        console.error('Recharge wallet error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to recharge wallet'
        });
    }
};

// Debit wallet
const debitWallet = async (req, res) => {
    try {
        const userId = req.user._id;
        const { amount, description, orderId, shipmentId } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }

        const wallet = await Wallet.findOne({ userId });
        if (!wallet || wallet.balance < amount) {
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
        }

        const reference = generateTransactionId('WD');

        const transaction = await WalletTransaction.create({
            userId,
            type: 'debit',
            amount,
            description: description || 'Shipping charges',
            reference,
            orderId,
            shipmentId,
            status: 'completed',
            completedAt: new Date(),
            metadata: { debitType: 'shipping_charge', shipmentId }
        });

        wallet.balance -= amount;
        wallet.lastUsedAt = new Date();
        await wallet.save();

        res.json({
            success: true,
            message: 'Amount debited successfully',
            data: { transaction, newBalance: wallet.balance }
        });
    } catch (error) {
        console.error('Debit wallet error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to debit wallet'
        });
    }
};

// Get balance
const getBalance = async (req, res) => {
    try {
        const userId = req.user._id;
        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            wallet = await Wallet.create({ userId, balance: 0 });
        }

        res.json({
            success: true,
            data: { balance: wallet.balance, currency: 'INR' }
        });
    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch balance'
        });
    }
};

// Export transactions
const exportTransactions = async (req, res) => {
    try {
        const userId = req.user._id;
        const { type, month, format = 'csv' } = req.body;

        const filter = { userId };

        if (type && type !== 'all') filter.type = type;
        if (month && month !== 'all') {
            const monthNum = parseInt(month);
            const year = new Date().getFullYear();
            const startDate = new Date(year, monthNum, 1);
            const endDate = new Date(year, monthNum + 1, 0);
            filter.createdAt = { $gte: startDate, $lte: endDate };
        }

        const transactions = await WalletTransaction.find(filter).sort({ createdAt: -1 });

        if (format === 'csv') {
            const csv = generateCSV(transactions);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="wallet_transactions.csv"');
            res.send(csv);
        } else {
            res.json({ success: true, data: transactions });
        }
    } catch (error) {
        console.error('Export transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export transactions'
        });
    }
};

// Get transaction by ID
const getTransactionById = async (req, res) => {
    try {
        const userId = req.user._id;
        const { transactionId } = req.params;

        const transaction = await WalletTransaction.findOne({ _id: transactionId, userId });

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        res.json({ success: true, data: transaction });
    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transaction'
        });
    }
};

// Refund to wallet
const refundToWallet = async (req, res) => {
    try {
        const userId = req.user._id;
        const { amount, reason, orderId, shipmentId } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid refund amount' });
        }

        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            wallet = await Wallet.create({ userId, balance: 0 });
        }

        const reference = generateTransactionId('WR');

        const transaction = await WalletTransaction.create({
            userId,
            type: 'credit',
            amount,
            description: `Refund: ${reason}`,
            reference,
            orderId,
            shipmentId,
            status: 'completed',
            completedAt: new Date(),
            metadata: { refundType: 'order_cancellation', reason, shipmentId }
        });

        wallet.balance += amount;
        await wallet.save();

        res.json({
            success: true,
            message: 'Refund processed successfully',
            data: { transaction, newBalance: wallet.balance }
        });
    } catch (error) {
        console.error('Refund wallet error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process refund'
        });
    }
};

const getMonthlyShipmentInvoice = async (req, res) => {
    try {
        const userId = req.user._id;
        // Validate month and year
        let month = req.body.month
        let year = req.body.year

        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        if (monthNum < 1 || monthNum > 12) {
            return res.status(400).json({
                success: false,
                message: 'Invalid month. Please provide month between 1-12'
            });
        }

        if (yearNum < 2000 || yearNum > new Date().getFullYear()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid year'
            });
        }

        // Create date range for the month
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

        // Find wallet transactions related to shipments for the specified month
        const walletTransactions = await WalletTransaction.find({
            userId: userId,
            shipmentId: { $exists: true, $ne: null },
            status: 'completed',
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ createdAt: 1 });

        if (walletTransactions.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    transactions: []
                },
                message: 'No shipment transactions found for the specified month'
            });
        }

        // Get shipment details for each transaction
        const shipmentIds = walletTransactions.map(tx => tx.shipmentId);
        const shipments = await Shipment.find({
            id: { $in: shipmentIds }, status: "21"
        }).select('id awb parcel.weight cost_estimate billing_date createdAt');
        // Create shipment lookup map
        const shipmentMap = {};
        shipments.forEach(shipment => {
            shipmentMap[shipment.id] = shipment;
        });
        console.log(shipments)

        // Get user billing settings
        const billingSetting = await BillingSetting.findOne({
            userId: userId,
        });

        // Process transactions and calculate totals
        let totalTaxableValue = 0;
        const transactionDetails = [];

        walletTransactions.forEach(transaction => {
            const shipment = shipmentMap[transaction.shipmentId];
            // Calculate taxable amount (remove 18% tax to get base amount)
            const taxableAmount = transaction.amount / 1.18;
            const taxAmount = transaction.amount - taxableAmount;

            totalTaxableValue += taxableAmount;

            transactionDetails.push({
                shipmentId: transaction.shipmentId,
                awb: shipment?.awb || 'N/A',
                date: transaction.createdAt.toLocaleDateString('en-GB'),
                weight: shipment?.parcel?.weight?.weight || 0,
                weightUnit: shipment?.parcel?.weight?.unit || 'gm',
                taxableAmount: parseFloat(taxableAmount.toFixed(2)),
                taxAmount: parseFloat(taxAmount.toFixed(2)),
                billedAmount: transaction.amount,
                transactionReference: transaction.reference,
                description: transaction.description
            });
        });

        // Calculate totals
        const totalTaxAmount = totalTaxableValue * 0.18;
        const totalInvoiceValue = totalTaxableValue + totalTaxAmount;

        // Generate invoice metadata
        const invoiceDate = endDate.toLocaleDateString('en-GB');
        const invoiceNo = generateInvoiceNumber(userId, monthNum, yearNum);

        // Prepare response
        const invoiceData = {
            success: true,
            data: {
                // Invoice metadata
                invoiceMetadata: {
                    invoiceDate: invoiceDate,
                    invoiceNo: invoiceNo,
                    taxableValue: parseFloat(totalTaxableValue.toFixed(2)),
                    tax: parseFloat(totalTaxAmount.toFixed(2)),
                    invoiceValue: parseFloat(totalInvoiceValue.toFixed(2)),
                    month: monthNum,
                    year: yearNum,
                    currency: 'INR'
                },

                // Admin/Company details (Demo data - replace with actual admin settings)
                adminDetails: {
                    companyName: "PETSHALA LOGISTICS PRIVATE LIMITED",
                    gstNumber: "09EBPBFP3753P2Z6",
                    address: "01, 443, Geeta Bhawan, Sarovar Road, Mangilal Auto Repairs",
                    city: "Rampura, Kota",
                    state: "Rajasthan",
                    pincode: "324006",
                    country: "India",
                    phone: "6619152463",
                    email: "prajapatimanju135@gmail.com"
                },

                // User billing details
                billingDetails: billingSetting ? {
                    companyName: billingSetting.companyName || 'N/A',
                    billingAddress: billingSetting.billingAddress || 'N/A',
                    city: billingSetting.city || 'N/A',
                    state: billingSetting.state || 'N/A',
                    pincode: billingSetting.pincode || 'N/A',
                    gstNumber: billingSetting.gstNumber || 'N/A',
                    panNumber: billingSetting.panNumber || 'N/A'
                } : null,

                // Transaction details
                transactions: transactionDetails,

                // Summary
                summary: {
                    totalTransactions: transactionDetails.length,
                    totalShipments: transactionDetails.length,
                    totalWeight: transactionDetails.reduce((sum, tx) => sum + tx.weight, 0),
                    totalTaxableValue: parseFloat(totalTaxableValue.toFixed(2)),
                    totalTaxAmount: parseFloat(totalTaxAmount.toFixed(2)),
                    totalInvoiceValue: parseFloat(totalInvoiceValue.toFixed(2))
                },

                // Tax breakdown for display
                taxBreakdown: {
                    serviceName: "Logistics Service",
                    quantity: transactionDetails.length,
                    ratePerItem: parseFloat((totalTaxableValue / transactionDetails.length).toFixed(2)),
                    taxableValue: parseFloat(totalTaxableValue.toFixed(2)),
                    cgst: {
                        rate: "9%",
                        amount: parseFloat((totalTaxAmount / 2).toFixed(2))
                    },
                    sgst: {
                        rate: "9%",
                        amount: parseFloat((totalTaxAmount / 2).toFixed(2))
                    },
                    igst: {
                        rate: "18%",
                        amount: 0.00
                    },
                    totalRate: "18%",
                    totalAmount: parseFloat(totalInvoiceValue.toFixed(2))
                }
            }
        };

        res.status(200).json(invoiceData);

    } catch (error) {
        console.error('Error generating monthly shipment invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while generating invoice',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const generateInvoiceNumber = (userId, month, year) => {
    const userIdSuffix = userId.toString().slice(-4);
    const monthPadded = month.toString().padStart(2, '0');
    const yearSuffix = year.toString().slice(-2);

    // Deterministic hash: always same for same user+month+year
    const hash = crypto
        .createHash('md5')
        .update(`${userId}-${month}-${year}`)
        .digest('hex')
        .slice(0, 3)
        .toUpperCase();

    return `${yearSuffix}${monthPadded}${userIdSuffix}${hash}`;
};


module.exports = {
    getMonthlyShipmentInvoice,
    getWalletStats,
    getTransactions,
    rechargeWallet,
    debitWallet,
    getBalance,
    exportTransactions,
    getTransactionById,
    refundToWallet
};
