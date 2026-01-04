
// routes/wallet.js
const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middlewares/authMiddleware');
// const { validateWalletRecharge, validateWalletDebit } = require('../middlewares/validation');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// GET /api/wallet/stats - Get wallet statistics
router.get('/stats', walletController.getWalletStats);

// GET /api/wallet/balance - Get current wallet balance
router.get('/balance', walletController.getBalance);

// GET /api/wallet/transactions - Get wallet transactions with filters
router.get('/transactions', walletController.getTransactions);

// GET /api/wallet/transactions/:transactionId - Get specific transaction
router.get('/transactions/:transactionId', walletController.getTransactionById);

// POST /api/wallet/recharge - Recharge wallet
router.post('/recharge', walletController.rechargeWallet);

// POST /api/wallet/debit - Debit wallet (internal use for shipping charges)
router.post('/debit', walletController.debitWallet);

// POST /api/wallet/refund - Refund to wallet
router.post('/refund', walletController.refundToWallet);

// GET /api/wallet/export - Export transactions
router.post('/export', walletController.getMonthlyShipmentInvoice);

module.exports = router;