const Checkout = require("../models/Checkout");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order");
const validateFawaterkWebhook = require("../middlewares/validateFawaterkWebhook");

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
    res.status(201).json({ status: "success", data: checkout });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const getUserCheckouts = async (req, res) => {
  try {
    const userId = req.user._id;
    const checkouts = await Checkout.find({ user: userId }).populate(
      "items.product",
      "name price"
    );
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
    }).populate("items.product", "name price");

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

const successPayment = async (req, res) => {
  const body = req.body;

  const isValid = validateFawaterkWebhook(body, "paid");
  if (!isValid) {
    return res
      .status(400)
      .json({ status: "fail", message: "Invalid hash key. Webhook rejected." });
  }

  try {
    const checkoutId = body.pay_load?.checkoutId;
    if (!checkoutId) {
      return res
        .status(400)
        .json({ status: "fail", message: "checkoutId not found in payload." });
    }

    const checkout = await Checkout.findById(checkoutId);

    if (!checkout) {
      console.warn(
        `Webhook received for non-existent checkoutId: ${checkoutId}`
      );
      return res
        .status(200)
        .json({ message: "Webhook acknowledged, but checkout not found." });
    }

    if (checkout.status === "completed") {
      return res.status(200).json({
        message: "Webhook for an already completed checkout. Acknowledged.",
      });
    }

    checkout.status = "completed";
    checkout.paymentStatus = "paid";
    checkout.isFinalized = true;
    checkout.FinalizedAt = new Date();
    await checkout.save();

    const order = new Order({
      user: checkout.user,
      items: checkout.items,
      totalPrice: checkout.totalPrice,
      shippingAddress: checkout.shippingAddress,
      paymentDetails: {
        method: body.payment_method,
        invoiceId: body.invoice_id,
        referenceNumber: body.referenceNumber,
      },
      status: "processing",
    });

    await order.save();
  } catch (error) {
    console.error("Error processing successful payment webhook:", error);
  }
  res.status(200).json({ message: "Webhook received successfully." });
};

const failPayment = async (req, res) => {
  const body = req.body;

  const isValid = validateFawaterkWebhook(body, "expired");
  if (!isValid) {
    return res
      .status(400)
      .json({ status: "fail", message: "Invalid hash key. Webhook rejected." });
  }

  try {
    const checkoutId = body.pay_load?.checkoutId;
    if (!checkoutId) {
      return res
        .status(400)
        .json({ status: "fail", message: "checkoutId not found in payload." });
    }

    const checkout = await Checkout.findById(checkoutId);

    if (!checkout) {
      console.warn(
        `Webhook received for non-existent checkoutId: ${checkoutId}`
      );
      return res
        .status(200)
        .json({ message: "Webhook acknowledged, but checkout not found." });
    }

    if (checkout.status === "canceled") {
      return res
        .status(200)
        .json({
          message: "Webhook for an already canceled checkout. Acknowledged.",
        });
    }

    checkout.status = "canceled";
    checkout.paymentStatus = "failed";
    checkout.isFinalized = true;
    checkout.FinalizedAt = new Date();
    await checkout.save();
  } catch (error) {
    console.error("Error processing failed payment webhook:", error);
  }

  res.status(200).json({ message: "Webhook received successfully." });
};

module.exports = {
  createCheckout,
  getUserCheckouts,
  getCheckoutById,
  successPayment,
  failPayment,
};
