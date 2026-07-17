const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart_city');
    console.log(`✅ Connected to MongoDB Database: ${conn.connection.host}`);
    
    // Automatically run seeding if needed
    const seedMongo = require('./seedMongo');
    await seedMongo();
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    // Do not crash in development to allow other parts of the engine to work
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
