const express = require("express");
const router = express.Router();
const orderAdminController = require("../controllers/orderAdminController");
const { protect, admin } = require("../middlewares/auth");

router.use(protect, admin);

router.get("/", orderAdminController.getAllOrders);
router.put("/:orderId", orderAdminController.updateOrderStatus);

module.exports = router;