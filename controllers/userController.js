const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (user, time) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: time,
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ status: "fail", message: "User already exists" });
    }
    const user = new User({ name, email, password });
    const accessToken = generateToken(user, "15m");
    const refreshToken = generateToken(user, "7d");
    user.refreshToken = refreshToken;
    await user.save();
    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        user: { name: user.name, email: user.email, role: user.role },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ status: "fail", message: "Invalid email or password" });
    }
    let isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ status: "fail", message: "Invalid email or password" });
    }
    const accessToken = generateToken(user, "15m");
    const refreshToken = generateToken(user, "7d");
    user.refreshToken = refreshToken;
    await user.save();
    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        user: { name: user.name, email: user.email, role: user.role },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res
        .status(400)
        .json({ status: "fail", message: "Refresh token is required" });
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res
        .status(401)
        .json({ status: "fail", message: "Invalid refresh token" });
    }
    const newAccessToken = generateToken(user, "15m");
    await user.save();
    res.status(200).json({
      status: "success",
      message: "Token refreshed successfully",
      data: { accessToken: newAccessToken },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    res.status(200).json({
      status: "success",
      data: {
        user: {
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getProfile,
};
