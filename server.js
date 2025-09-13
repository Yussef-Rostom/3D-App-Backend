const express = require("express");
const cors = require("cors");
const connectToDatabase = require("./config/db");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRouts");
const cartRoutes = require("./routes/cartRouts");
const checkoutRoutes = require("./routes/checkoutRouts");
const { loadUser } = require("./middlewares/auth");

dotenv.config();
connectToDatabase();
const app = express();

app.use(cors());
app.use(loadUser);
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);

app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    status: "fail",
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
