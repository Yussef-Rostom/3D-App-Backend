const Order = require("../models/Order");

const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ user: userId }).populate(
      "items.product",
      "name price images"
    );
    res.status(200).json({ status: "success", data: orders });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId)
      .populate("user", "name email")
      .populate("items.product", "name price images");
    if (!order) {
      return res
        .status(404)
        .json({ status: "fail", message: "Order not found" });
    }
    if (
      req.user.role !== "admin" &&
      order.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ status: "fail", message: "Access denied" });
    }
    res.status(200).json({ status: "success", data: order });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

module.exports = {
  getUserOrders,
  getOrderById,
};
