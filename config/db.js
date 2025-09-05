const mongoogse = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL;

const connectToDatabase = async () => {
  try {
    await mongoogse.connect(MONGODB_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};
module.exports = connectToDatabase;
