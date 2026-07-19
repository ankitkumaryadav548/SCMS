const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;
    const isRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);

    if (!uri) {
      console.error('❌ CRITICAL: No MongoDB connection string found in environment variables!');
      console.error('   Expected process.env.MONGO_URI or MONGODB_URI to be set.');
      if (isRender || process.env.NODE_ENV === 'production') {
        throw new Error('MONGO_URI is missing in Render Environment Variables. Please add key MONGO_URI in your Render Web Service Environment settings.');
      }
    }

    const dbUri = uri || 'mongodb://localhost:27017/smart_city';
    console.log(`📡 Connecting to MongoDB (${dbUri.startsWith('mongodb+srv') ? 'Cloud Atlas' : dbUri})...`);
    
    const conn = await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 5000 // Fail fast if DB server is unreachable
    });
    console.log(`✅ Connected to MongoDB Database: ${conn.connection.host}`);
    
    // Automatically run seeding if needed
    const seedMongo = require('./seedMongo');
    await seedMongo();
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    if (process.env.RENDER || process.env.NODE_ENV === 'production') {
      console.error('🛑 Exiting application due to database connection failure on cloud server.');
      process.exit(1);
    }
  }
};

module.exports = connectDB;
