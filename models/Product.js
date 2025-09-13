const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
    },
    description: {
      type: String,
      required: [true, "description is required"],
    },
    price: {
      type: Number,
      required: [true, "price is required"],
    },
    category: {
      type: String,
      required: [true, "category is required"],
    },
    images: [
      {
        type: String,
      },
    ],
    tags: [{ type: String }],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user is required"],
    },
    dimensions: {
      length: {
        type: Number,
        required: true,
        min: [0.01, "Weight must be greater than 0"],
      },
      width: {
        type: Number,
        required: true,
        min: [0.01, "Weight must be greater than 0"],
      },
      height: {
        type: Number,
        required: true,
        min: [0.01, "Weight must be greater than 0"],
      },
    },
    weight: {
      type: Number,
      required: true,
      min: [0.01, "Weight must be greater than 0"],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    salesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
