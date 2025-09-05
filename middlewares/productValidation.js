const { body } = require("express-validator");
const validate = require("./validate");

const createProduct = () => {
  return [
    body("name")
      .notEmpty()
      .withMessage("Product name is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Product name must be between 2 and 100 characters")
      .trim(),

    body("description")
      .notEmpty()
      .withMessage("Product description is required")
      .isLength({ min: 10, max: 1000 })
      .withMessage("Description must be between 10 and 1000 characters")
      .trim(),

    body("price")
      .notEmpty()
      .withMessage("Price is required")
      .isFloat({ min: 0.01 })
      .withMessage("Price must be a number more than 0.01")
      .toFloat(),

    body("category")
      .notEmpty()
      .withMessage("Category is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("Category must be between 2 and 50 characters")
      .trim(),

    body("dimensions")
      .notEmpty()
      .withMessage("Dimensions are required")
      .isObject()
      .withMessage("Dimensions must be an object"),

    body("dimensions.length")
      .notEmpty()
      .withMessage("Length is required")
      .isFloat({ min: 0.001 })
      .withMessage("Length must be a number more than .001")
      .toFloat(),

    body("dimensions.width")
      .notEmpty()
      .withMessage("Width is required")
      .isFloat({ min: 0.001 })
      .withMessage("Width must be a number more than .001")
      .toFloat(),

    body("dimensions.height")
      .notEmpty()
      .withMessage("Height is required")
      .isFloat({ min: 0.001 })
      .withMessage("Height must be a number more than .001")
      .toFloat(),

    body("weight")
      .notEmpty()
      .withMessage("Weight is required")
      .isFloat({ min: 0.001 })
      .withMessage("Weight must be a number more than .001")
      .toFloat(),
    validate,
  ];
};

module.exports = {
    createProduct,
};
