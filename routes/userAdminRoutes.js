const express = require("express");
const router = express.Router();
const userAdminController = require("../controllers/userAdminController");
const { protect, admin } = require("../middlewares/auth");

router.use(protect, admin);
router
  .route("/")
  .get(userAdminController.getAllUsers)
  .post(userAdminController.addUser);

router
  .route("/:id")
  .put(userAdminController.updateUser)
  .delete(userAdminController.deleteUser);

module.exports = router;
