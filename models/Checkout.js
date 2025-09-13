const mongoose = require("mongoose");

const checkoutItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    material: {
      type: String,
      required: [true, "Material is required"],
    },
    color: {
      type: String,
      required: [true, "Color is required"],
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
  },
  { _id: false }
);

const checkoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [checkoutItemSchema],
    totalPrice: {
      type: Number,
      required: true,
      min: [1, "Total price must greater than 0"],
    },
    shippingAddress: {
      address: { type: String, required: [true, "address is required"] },
      city: { type: String, required: [true, "city is required"] },
      country: { type: String, required: [true, "country is required"] },
      phone: {
        type: String,
        required: [true, "Phone number is required"],
        validate: {
          validator: function (v) {
            const cleaned = v.replace(/\D/g, "");
            return /^(010|011|012|015)\d{8}$/.test(cleaned);
          },
          message:
            "Phone number must be 11 digits and start with 010, 011, 012, or 015",
        },
      },
      postalCode: { type: String, required: [true, "postalCode is required"] },
    },
    status: {
      type: String,
      enum: ["pending", "completed", "canceled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    isFinalized: {
      type: Boolean,
      default: false,
    },
    FinalizedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Checkout", checkoutSchema);
