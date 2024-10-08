require('dotenv').config();
const mongoose = require('mongoose');

const DB_NAME = process.env.DB_NAME;
const DB_URI = `mongodb://localhost:27017/${DB_NAME}`;

const connectDB = async () => {
    try {
      await mongoose.connect(DB_URI, {
        serverSelectionTimeoutMS: 5000 // 5 seconds
      });
      console.log('MongoDB connected');
    } catch (err) {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    }
  };
  
module.exports = connectDB;