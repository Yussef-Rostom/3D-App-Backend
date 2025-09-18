const Product = require("../models/Product");
const { validationResult } = require("express-validator");

const getAllProducts = async (req, res) => {
  try {
    const filter = {};
    if (!req.user || req.user.role !== "admin") {
      filter.isPublished = true;
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
        { tags: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const totalProducts = await Product.countDocuments(filter);

    let query = Product.find(filter);

    if (req.query.sortBy) {
      const sortByMap = {
        priceAsc: { price: 1 },
        priceDesc: { price: -1 },
        newest: { createdAt: -1 },
        popularity: { salesCount: -1 },
      };
      query = query.sort(sortByMap[req.query.sortBy] || { createdAt: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    const products = await query;

    res.status(200).json({
      status: "success",
      data: {
        results: products.length,
        totalPages: Math.ceil(totalProducts / limit),
        products,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const newProduct = new Product({
      ...req.body,
      user: req.user.id,
    });

    await newProduct.save();
    res.status(201).json({ status: "success", data: { product: newProduct } });
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
      return res
        .status(403)
        .json({ status: "fail", message: "Access denied to this product" });
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
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res
        .status(404)
        .json({ status: "fail", message: "Product not found" });
    }
    res.status(200).json({ status: "success", data: { product } });
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
    res.status(204).send();
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
    const bestSellers = await Product.find({ isPublished: true })
      .sort({ salesCount: -1 })
      .limit(5);

    if (!bestSellers || bestSellers.length === 0) {
      return res
        .status(404)
        .json({ status: "fail", message: "No products found" });
    }

    res.status(200).json({ status: "success", data: { bestSellers } });
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
