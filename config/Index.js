require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  SECRET_KEY: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV
};