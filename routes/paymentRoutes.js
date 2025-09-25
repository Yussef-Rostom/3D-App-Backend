const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { protect } = require("../middlewares/auth");

router.get("/methods", protect, paymentController.getPaymentMethods);
router.post("/execute", protect, paymentController.executePayment);
router.post("/webhook_json", paymentController.webhook_json);
router.post("/fail_json", paymentController.fail_json);

module.exports = router;
