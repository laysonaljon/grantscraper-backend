import mongoose from 'mongoose';

const connectDB = async (url) => {
  mongoose.set('strictQuery', true);
  
  try {
    await mongoose.connect(url, {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB with optimized settings');
  } catch (err) {
    console.error('Failed to connect to MongoDB');
    console.error(err);
    process.exit(1);
  }
};

export default connectDB;
