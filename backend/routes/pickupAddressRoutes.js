const express = require("express");
const router = express.Router();
const {
    addPickupAddress,
    getAllPickupAddresses,
    getPickupAddressById,
    updatePickupAddress,
    deletePickupAddress,
    getPickupAddressByWarehouseId
} = require("../controllers/pickupAddressController");

const authMiddleware = require("../middlewares/authMiddleware");

router.post("/", authMiddleware, addPickupAddress);
router.get("/", authMiddleware, getAllPickupAddresses);
router.get("/:id", authMiddleware, getPickupAddressById);
router.put("/:id", authMiddleware, updatePickupAddress);
router.delete("/:id", authMiddleware, deletePickupAddress);
router.get("/warehouseId/:id", authMiddleware, getPickupAddressByWarehouseId);

module.exports = router;
