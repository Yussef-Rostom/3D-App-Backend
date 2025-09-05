const jwt = require("jsonwebtoken");
const User = require("../models/User");

const decodeToken = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    req.token = req.headers.authorization.split(" ")[1];
    if (!req.token) {
      req.decodeTokenErrorMessage = "Not authorized, no token";
      next();
    }
  }
  try {
    const decoded = jwt.verify(req.token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select(
      "-password -refreshToken -__v"
    );
    if(!req.user) {
      req.decodeTokenErrorMessage = "Not authorized, user not found";
    }
    next();
  } catch (err) {
    req.decodeTokenErrorMessage = err.message;
    next();
  }
};

const protect = async (req, res, next) => {
  if(req.decodeTokenErrorMessage){
    return res.status(401).json({status: "fail", message: req.decodeTokenErrorMessage});
  }
  if(!req.user) {
    return res.status(401).json({status: "fail", message: "Not authorized, user not found"});
  }
  next();
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res
      .status(403)
      .json({ status: "fail", message: "Not authorized as an admin" });
  }
};

module.exports = { decodeToken, protect, admin };
