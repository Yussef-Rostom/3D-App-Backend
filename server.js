const express = require("express");
const cors = require("cors");
const connectToDatabase = require("./config/db");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRouts");
const { decodeToken } = require("./middlewares/auth");

dotenv.config();
connectToDatabase();
const app = express();


app.use(cors());
app.use(decodeToken);
app.use(express.json());

const PORT = process.env.PORT || 3000;


app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);


app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});