const express = require('express');
const PlanController = require('../controllers/planController');
const UserPlanController = require('../controllers/userPlanController');
const AdminController = require('../controllers/adminController');
const adminMiddleware = require("../middlewares/adminMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const BillingController = require('../controllers/authController');
const router = express.Router();


// ===== ADMIN ROUTES =====
router.post('/plan', authMiddleware, adminMiddleware, PlanController.createPlan);

router.put('/update-plan/:planId', authMiddleware, adminMiddleware, PlanController.updatePlan);

router.get('/plan-stats', authMiddleware, adminMiddleware, UserPlanController.getPlanStatistics);
router.get('/users', authMiddleware, adminMiddleware, AdminController.getAllUsers);
router.get('/user/:id', authMiddleware, adminMiddleware, AdminController.getUserById);
router.put('/user/:id', authMiddleware, adminMiddleware, AdminController.updateUserById);
router.patch('/user/:id/status', authMiddleware, adminMiddleware, AdminController.updateUserStatus);
router.delete('/user/:id', authMiddleware, adminMiddleware, AdminController.deleteUser);
router.post('/create-payout', authMiddleware, adminMiddleware, AdminController.createPayout);
router.post('/payout-summaries', authMiddleware, adminMiddleware, AdminController.getAllPayoutSummaries);
router.post('/cod-shipments', authMiddleware, adminMiddleware, AdminController.getPendingCODShipmentsForUser);
router.get('/billing/:userId', AdminController.getBillingSettingById);

// POST /api/wallet/credit - Recharge wallet
router.post('/payout-credit', AdminController.adminWalletCredits);

module.exports = router;