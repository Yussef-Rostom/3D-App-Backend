const { body } = require("express-validator");
const validate = require("./validate");

const CartItem = () => {
  return [
    body("productId")
      .notEmpty()
      .withMessage("Product ID is required")
      .isMongoId()
      .withMessage("Valid Product ID is required"),

    body("material")
      .notEmpty()
      .withMessage("Material is required")
      .isLength({ min: 1, max: 50 })
      .withMessage("Material must be between 1 and 50 characters")
      .trim(),

    body("color")
      .notEmpty()
      .withMessage("Color is required")
      .isLength({ min: 1, max: 30 })
      .withMessage("Color must be between 1 and 30 characters")
      .trim(),

    validate,
  ];
};


module.exports = {
  CartItem,
};
