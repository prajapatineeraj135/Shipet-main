const express = require("express");
const router = express.Router();
const pincodeController = require("../controllers/pincodeController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/check", authMiddleware, pincodeController.checkPincode);

module.exports = router;
