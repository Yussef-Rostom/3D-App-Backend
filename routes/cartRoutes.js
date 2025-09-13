const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const cartValidation = require("../middlewares/cartValidation");

router
  .route("/")
  .get(cartController.getCart)
  .post(cartValidation.CartItem(), cartController.addToCart)
  .put(cartValidation.CartItem(), cartController.updateCartItemQuantity)
  .delete(cartValidation.CartItem(), cartController.deleteCartItem);

router.put("/merge", cartController.mergeCarts);

module.exports = router;
