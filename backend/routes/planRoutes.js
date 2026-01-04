const express = require('express');
const PlanController = require('../controllers/planController');
const UserPlanController = require('../controllers/userPlanController');
const adminMiddleware = require("../middlewares/adminMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

// Get all active plans (public)
router.get('/', PlanController.getAllPlan);

// Get specific plan by ID (public)
router.get('/:planId', PlanController.getPlanById);

// ===== PROTECTED USER ROUTES =====
// Get user's current plan
router.get('/user/current-plan', authMiddleware, UserPlanController.getCurrentUserPlans);

// Upgrade user's plan
router.post('/user/upgrade-plan', authMiddleware, UserPlanController.upgradeUserPlan);

// Get user's plan history
router.get('/user/plan-history', authMiddleware, UserPlanController.getPlanHistory);

// Calculate shipping rate with user's plan commission
router.post('/user/calculate-shipping', authMiddleware, UserPlanController.calculateShippingRate);

// ===== UTILITY ROUTES =====
// Health check for plans service
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Plans service is healthy',
        timestamp: new Date().toISOString()
    });
});
module.exports = router;