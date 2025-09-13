const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { protect, admin } = require("../middlewares/auth");

router.get("/my-orders", protect, orderController.getUserOrders);
router.get("/:orderId", protect, orderController.getOrderById);

module.exports = router;
