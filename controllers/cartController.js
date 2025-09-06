const Cart = require("../models/Cart");
const Product = require("../models/Product");

const getCart = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const gestId = req.headers["gest-id"] || null;

    let cart;
    if (userId) {
      cart = await Cart.findOne({ user: userId }).populate("items.product");
    } else if (gestId) {
      cart = await Cart.findOne({ gestId }).populate("items.product");
    } else {
      return res.status(400).json({
        status: "fail",
        message: "User ID or Guest ID is required",
      });
    }

    if (!cart) {
      return res.status(200).json({
        status: "success",
        message: "Cart is emp",
        data: { items: [] },
      });
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

    if (quantity <= 0) {
      return res.status(400).json({
        status: "fail",
        message: "Quantity must be greater than 0",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found",
      });
    }

    if (!product.isPublished) {
      return res.status(400).json({
        status: "fail",
        message: "Product is not available for sale",
      });
    }

    let cart;
    if (userId) {
      cart = await Cart.findOne({ user: userId });
      if (!cart) {
        cart = new Cart({ user: userId, items: [] });
      }
    } else if (gestId) {
      cart = await Cart.findOne({ gestId });
      if (!cart) {
        cart = new Cart({ gestId, items: [] });
      }
    } else {
      return res.status(400).json({
        status: "fail",
        message: "User ID or Guest ID is required",
      });
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
      cart.items.push({ product: productId, material, color, quantity });
    }

    cart.totalPrice += product.price * Number(quantity);

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
      return res.status(400).json({
        status: "fail",
        message: "User ID or Guest ID is required",
      });
    }

    let cart;
    if (userId) {
      cart = await Cart.findOne({ user: userId });
    } else {
      cart = await Cart.findOne({ gestId });
    }

    if (!cart) {
      return res.status(400).json({
        status: "fail",
        message: "Cart not found",
      });
    }

    const { productId, material, color, quantity } = req.body;

    if (quantity === null || quantity < 0) {
      return res.status(400).json({
        status: "fail",
        message: "Quantity must be greater or equal than 0",
      });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.material === material &&
        item.color === color
    );

    if (existingItemIndex <= -1) {
      return res.status(404).json({
        status: "fail",
        message: "Item not found in cart",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found",
      });
    }

    if (cart.items[existingItemIndex].quantity <= 0) {
      return res.status(400).json({
        status: "fail",
        message: "This item is not in your cart",
      });
    }

    cart.totalPrice -= product.price * cart.items[existingItemIndex].quantity;

    if (quantity > 0) {
      cart.items[existingItemIndex].quantity = Number(quantity);
      cart.totalPrice += product.price * Number(quantity);
    } else {
      cart.items.splice(existingItemIndex, 1);
    }

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
    req.body.quantity = 0;
    updateCartItemQuantity(req, res);
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const mergeCarts = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const gestId = req.headers["gest-id"] || null;

    if (!userId || !gestId) {
      return res.status(400).json({
        status: "fail",
        message: "User ID and Guest ID is required",
      });
    }
 
    const userCart = await Cart.findOne({ user: userId });
    const guestCart = await Cart.findOne({ gestId });

    if (!guestCart) {
      if (!userCart) {
        newCart = new Cart({ user: userId, items: [] });
        return res.status(200).json({
          status: "success",
          message: "No carts to merge",
          data: { newCart },
        });
      }
      return res.status(200).json({ status: "success", data: userCart });
    }

    if (!userCart) {
      guestCart.user = userId;
      guestCart.gestId = null;
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
        userCart.items[existingItemIndex].quantity += Number(
          guestItem.quantity
        );
      } else {
        userCart.items.push(guestItem);
      }
    }

    userCart.totalPrice += guestCart.totalPrice;
    await userCart.save();

    try {
      await Cart.findByIdAndDelete(guestCart._id);
    } catch (err) {
      console.error("Failed to delete guest cart:", err);
    }

    res.status(200).json({ status: "success", data: userCart });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

module.exports = { getCart, addToCart, updateCartItemQuantity, deleteCartItem, mergeCarts };
