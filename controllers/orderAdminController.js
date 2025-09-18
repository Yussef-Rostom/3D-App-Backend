const Order = require("../models/Order");

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("items.product", "name");

    res.status(200).json({
      status: "success",
      results: orders.length,
      data: orders,
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "canceled",
    ];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid status value." });
    }

    const updateData = { status };
    if (status === "delivered") {
      updateData.deliveredAt = new Date();
    }

    const order = await Order.findByIdAndUpdate(orderId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!order) {
      return res
        .status(404)
        .json({ status: "fail", message: "Order not found" });
    }

    populatedOrder = await order.populate("user", "name email");
    populatedOrder = await populatedOrder.populate("items.product", "name");

    res.status(200).json({ status: "success", data: populatedOrder });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

module.exports = {
  getAllOrders,
  updateOrderStatus,
};
