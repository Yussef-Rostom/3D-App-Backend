const Checkout = require("../models/Checkout");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const createCheckout = async (req, res) => {
  try {
    const { shippingAddress } = req.body;
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });

    if (!cart || cart.items.length === 0) {
      return res
        .status(400)
        .json({ status: "fail", message: "Your cart is empty" });
    }

    let totalPrice = 0;
    const itemsForCheckout = [];

    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.product);
      if (!product) {
        return res.status(404).json({
          status: "fail",
          message: `Product with ID ${cartItem.product} not found`,
        });
      }
      totalPrice += product.price * cartItem.quantity;
      itemsForCheckout.push({
        product: cartItem.product,
        material: cartItem.material,
        color: cartItem.color,
        quantity: cartItem.quantity,
        price: product.price,
      });
    }

    const checkout = new Checkout({
      user: userId,
      items: itemsForCheckout,
      totalPrice,
      shippingAddress,
    });

    await checkout.save();

    await Cart.findOneAndDelete({ user: userId });
    populatedCheckout = await checkout.populate(
      "items.product",
      "name price images"
    );

    res.status(201).json({ status: "success", data: populatedCheckout });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const getUserCheckouts = async (req, res) => {
  try {
    const userId = req.user._id;
    const checkouts = await Checkout.find({
      user: userId,
      status: { $in: ["wait_payment", "pending_payment"] },
    })
      .sort({ createdAt: -1 })
      .populate("items.product", "name price images");

    res.status(200).json({ status: "success", data: checkouts });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const getCheckoutById = async (req, res) => {
  try {
    const checkoutId = req.params.id;
    const userId = req.user._id;

    const checkout = await Checkout.findOne({
      _id: checkoutId,
      user: userId,
    }).populate("items.product", "name price images");

    if (!checkout) {
      return res
        .status(404)
        .json({ status: "fail", message: "Checkout not found" });
    }

    res.status(200).json({ status: "success", data: checkout });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

module.exports = {
  createCheckout,
  getUserCheckouts,
  getCheckoutById,
};
