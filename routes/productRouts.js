const express = require("express");
const router = express.Router();
const productController = require("../controllers/productControllers");
const { admin, protect } = require("../middlewares/auth");
const productValidation = require("../middlewares/productValidation");

router
  .route("/")
  .get(productController.getAllProducts)
  .post(
    protect,
    admin,
    productValidation.createProduct(),
    productController.createProduct
  );


router.get("/best-seller", productController.getBestSellerProduct);
router.get("/new-arrivals", productController.getNewArrivals);

router
  .route("/:id")
  .get(productController.getProductById)
  .put(protect, admin, productController.updateProduct)
  .delete(protect, admin, productController.deleteProduct);

router.get("/:id/similar", productController.getSimilarProducts);

module.exports = router;
