const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const userValidation = require("../middlewares/userValidation");
const { protect } = require("../middlewares/auth");

router.post("/register", userValidation.register(), userController.register);
router.post("/login", userValidation.login(), userController.login);
router.post("/refresh-token", userController.refreshToken);
router.get("/profile", protect, userController.getProfile);

module.exports = router;
