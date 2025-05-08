const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB conectada');
  } catch (error) {
    console.error('Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;