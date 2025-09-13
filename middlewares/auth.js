const jwt = require("jsonwebtoken");
const User = require("../models/User");

const loadUser = async (req, res, next) => {
  req.user = null;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
      }
    } catch (error) {
    }
  }
  next();
};

const protect = async (req, res, next) => {
  if (req.user) return next();
  return res
    .status(401)
    .json({ status: "fail", message: "Not authorized, user not found" });
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res
    .status(403)
    .json({ status: "fail", message: "Not authorized as an admin" });
};

module.exports = { loadUser, protect, admin };
