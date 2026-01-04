const express = require('express');
const router = express.Router();
const ndrController = require('../controllers/ndrController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Main dashboard stats endpoint
router.post('/webhook', ndrController.getNDRDataFromIcarry);
router.get('/shipments', ndrController.getNDRShipments);
router.get('/stats', ndrController.getNDRStats);
router.post('/shipments/:id/action', ndrController.takeAction);

module.exports = router;