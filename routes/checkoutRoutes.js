const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");
const { protect } = require("../middlewares/auth");

router
  .route("/")
  .post(protect, checkoutController.createCheckout)
  .get(protect, checkoutController.getUserCheckouts);

router.get("/:id", protect, checkoutController.getCheckoutById);

module.exports = router;
