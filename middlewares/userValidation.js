const { body } = require("express-validator");
const validate = require("./validate");

const register = (res, req, next) => {
  return [
    body("name").notEmpty().withMessage("name is required"),
    body("email").isEmail().withMessage("Please include a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("password must be at least 6 characters long"),
    validate,
  ];
};

const login = (res, req, next) => {
  return [
    body("email").isEmail().withMessage("Please include a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("password must be at least 6 characters long"),
    validate,
  ];
};

module.exports = {
  register,
  login,
};
