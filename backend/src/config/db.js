const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri && process.env.NODE_ENV === 'production') {
      throw new Error('MONGO_URI environment variable is missing! Please set MONGO_URI in your Render environment variables.');
    }

    const dbUri = uri || 'mongodb://localhost:27017/smart_city';
    console.log(`📡 Connecting to MongoDB...`);
    const conn = await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 5000 // Fail fast if DB server is unreachable
    });
    console.log(`✅ Connected to MongoDB Database: ${conn.connection.host}`);
    
    // Automatically run seeding if needed
    const seedMongo = require('./seedMongo');
    await seedMongo();
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    if (process.env.NODE_ENV === 'production') {
      console.error('🛑 Exiting application due to database connection failure in production.');
      process.exit(1);
    }
  }
};

module.exports = connectDB;
