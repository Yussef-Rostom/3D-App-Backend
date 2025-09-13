const Cart = require("../models/Cart");
const Product = require("../models/Product");

const recalculateCart = (cart) => {
  let totalPrice = 0;
  for (const item of cart.items) {
    totalPrice += item.price * item.quantity;
  }
  cart.totalPrice = totalPrice;
  return cart;
};

const getCart = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const gestId = req.headers["gest-id"] || null;

    if (!userId && !gestId) {
      return res
        .status(200)
        .json({ status: "success", data: { items: [], totalPrice: 0 } });
    }

    const query = userId ? { user: userId } : { gestId };
    let cart = await Cart.findOne(query).populate("items.product");

    if (!cart) {
      const newCartData = { items: [], totalPrice: 0 };
      if (userId) newCartData.user = userId;
      if (gestId) newCartData.gestId = gestId;

      const newCart = new Cart(newCartData);
      await newCart.save();

      return res.status(200).json({ status: "success", data: newCart });
    }

    res.status(200).json({ status: "success", data: cart });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const gestId = req.headers["gest-id"] || null;
    const { productId, material, color, quantity } = req.body;

    if (!userId && !gestId) {
      return res
        .status(400)
        .json({ status: "fail", message: "User ID or Guest ID is required" });
    }

    if (!quantity || Number(quantity) <= 0) {
      return res.status(400).json({
        status: "fail",
        message: "Quantity must be a positive number",
      });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isPublished) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found or not available",
      });
    }

    const query = userId ? { user: userId } : { gestId };
    let cart = await Cart.findOne(query);

    if (!cart) {
      cart = new Cart(query);
    }

    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.material === material &&
        item.color === color
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += Number(quantity);
    } else {
      cart.items.push({
        product: productId,
        material,
        color,
        quantity: Number(quantity),
        price: product.price,
      });
    }

    recalculateCart(cart);
    await cart.save();

    const populatedCart = await cart.populate("items.product");
    res.status(200).json({ status: "success", data: populatedCart });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const updateCartItemQuantity = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const gestId = req.headers["gest-id"] || null;

    if (!userId && !gestId) {
      return res
        .status(400)
        .json({ status: "fail", message: "User ID or Guest ID is required" });
    }

    const { productId, material, color, quantity } = req.body;

    if (quantity === null || Number(quantity) < 0) {
      return res.status(400).json({
        status: "fail",
        message: "Quantity must be a non-negative number",
      });
    }

    const query = userId ? { user: userId } : { gestId };
    const cart = await Cart.findOne(query);

    if (!cart) {
      return res
        .status(404)
        .json({ status: "fail", message: "Cart not found" });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.material === material &&
        item.color === color
    );

    if (existingItemIndex <= -1) {
      return res
        .status(404)
        .json({ status: "fail", message: "Item not found in cart" });
    }

    if (Number(quantity) > 0) {
      cart.items[existingItemIndex].quantity = Number(quantity);
    } else {
      cart.items.splice(existingItemIndex, 1);
    }

    recalculateCart(cart);
    await cart.save();

    const populatedCart = await cart.populate("items.product");
    res.status(200).json({ status: "success", data: populatedCart });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const deleteCartItem = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const gestId = req.headers["gest-id"] || null;

    if (!userId && !gestId) {
      return res
        .status(400)
        .json({ status: "fail", message: "User ID or Guest ID is required" });
    }

    const { productId, material, color } = req.body;

    const query = userId ? { user: userId } : { gestId };
    const cart = await Cart.findOne(query);

    if (!cart) {
      return res
        .status(404)
        .json({ status: "fail", message: "Cart not found" });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === productId &&
          item.material === material &&
          item.color === color
        )
    );

    if (cart.items.length === initialLength) {
      return res
        .status(404)
        .json({ status: "fail", message: "Item not found in cart to delete" });
    }

    recalculateCart(cart);
    await cart.save();

    const populatedCart = await cart.populate("items.product");
    res.status(200).json({ status: "success", data: populatedCart });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const mergeCarts = async (req, res) => {
  try {
    const userId = req.user.id;
    const gestId = req.headers["gest-id"] || null;

    if (!userId || !gestId) {
      return res
        .status(400)
        .json({ status: "fail", message: "User ID and Guest ID are required" });
    }

    let userCart = await Cart.findOne({ user: userId });
    const guestCart = await Cart.findOne({ gestId });

    if (!guestCart) {
      return res.status(200).json({
        status: "success",
        message: "No guest cart to merge",
        data: userCart,
      });
    }

    if (!userCart) {
      guestCart.user = userId;
      guestCart.gestId = undefined;
      await guestCart.save();
      return res.status(200).json({ status: "success", data: guestCart });
    }

    for (const guestItem of guestCart.items) {
      const existingItemIndex = userCart.items.findIndex(
        (item) =>
          item.product.toString() === guestItem.product.toString() &&
          item.material === guestItem.material &&
          item.color === guestItem.color
      );

      if (existingItemIndex > -1) {
        userCart.items[existingItemIndex].quantity += guestItem.quantity;
      } else {
        userCart.items.push(guestItem);
      }
    }

    recalculateCart(userCart);
    await userCart.save();
    try {
      await Cart.findByIdAndDelete(guestCart._id);
    } catch (err) {
      console.error(err.message);
    }

    const populatedCart = await userCart.populate("items.product");
    res.status(200).json({ status: "success", data: populatedCart });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItemQuantity,
  deleteCartItem,
  mergeCarts,
};
