const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Main dashboard stats endpoint
router.get('/overview', dashboardController.getStats);

// Additional analytics endpoints
router.get('/revenue-chart', dashboardController.getRevenueChart);
router.get('/status-distribution', dashboardController.getStatusDistribution);

module.exports = router;