const Product = require("../models/Product");

const getAllProducts = async (req, res) => {
  try {
    let query = {};
    if (!req.user || req.user.role !== "admin") {
      query.isPublished = true;
    }
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
        { tags: { $regex: req.query.search, $options: "i" } },
      ];
    }

    let sort = {};
    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case "priceAsc":
          sort = { price: 1 };
          break;
        case "priceDesc":
          sort = { price: -1 };
          break;
        case "newest":
          sort = { createdAt: -1 };
          break;
        case "popularity":
          sort = { salesCount: -1 };
          break;
        default:
          break;
      }
    }

    const products = await Product.find(query)
      .sort(sort)
      .limit(req.query.limit || 0);
    res.status(200).json({ status: "success", data: { products } });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      images,
      tags,
      dimensions,
      weight,
    } = req.body;

    const product = new Product({
      name,
      description,
      price,
      category,
      images,
      tags,
      dimensions,
      weight,
      user: req.user.id,
    });

    await product.save();
    res.status(201).json({ status: "success", data: { product } });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ status: "fail", message: "Product not found" });
    }

    if (!product.isPublished && (!req.user || req.user.role !== "admin")) {
      return res.status(403).json({ status: "fail", message: "Access denied" });
    }

    res.status(200).json({ status: "success", data: { product } });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const allowedUpdates = [
      "name",
      "description",
      "price",
      "category",
      "images",
      "tags",
      "dimensions",
      "weight",
      "isPublished",
    ];
    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found",
      });
    }
    res.status(200).json({
      status: "success",
      data: { product },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ status: "fail", message: "Product not found" });
    }

    res.status(200).json({ status: "success", message: "Product deleted" });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const getSimilarProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ status: "fail", message: "Product not found" });
    }

    if (!product.isPublished && (!req.user || req.user.role !== "admin")) {
      return res.status(403).json({ status: "fail", message: "Access denied" });
    }

    const similarProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isPublished: true,
    }).limit(10);

    res.status(200).json({ status: "success", data: { similarProducts } });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const getBestSellerProduct = async (req, res) => {
  try {
    console.log("Fetching best-seller product");
    const bestSeller = await Product.findOne({ isPublished: true }).sort({
      salesCount: -1,
    });

    if (!bestSeller) {
      return res
        .status(404)
        .json({ status: "fail", message: "No products found" });
    }

    res.status(200).json({ status: "success", data: { bestSeller } });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const getNewArrivals = async (req, res) => {
  try {
    const newArrivals = await Product.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(10);

    if (!newArrivals || newArrivals.length === 0) {
      return res
        .status(404)
        .json({ status: "fail", message: "No products found" });
    }

    res.status(200).json({ status: "success", data: { newArrivals } });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getSimilarProducts,
  getBestSellerProduct,
  getNewArrivals,
};
