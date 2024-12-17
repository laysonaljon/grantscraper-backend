import mongoose from 'mongoose';

const connectDB = async (url) => {
  mongoose.set('strictQuery', true);
  
  try {
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB');
    console.error(err);
    process.exit(1);
  }
};

export default connectDB;
