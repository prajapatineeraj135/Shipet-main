const express = require('express');
const router = express.Router();
const codController = require('../controllers/codRemittanceController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);
router.post('/shipments', codController.getUserCODShipments);
router.post('/', codController.getUserPayoutSummaries);
router.get('/payout/:payoutId', codController.getPayoutSummaryDetails);

module.exports = router;
