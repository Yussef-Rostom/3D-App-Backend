const express = require("express");
const multer = require("multer");
const uploadController = require("../controllers/uploadController");
const { protect, admin } = require("../middlewares/auth");
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/",
  protect,
  admin,
  upload.single("file"),
  uploadController.uploadImage
);

module.exports = router;
