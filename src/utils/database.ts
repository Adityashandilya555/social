import mongoose from 'mongoose';
import { MONGODB_URI } from '@env';

let isConnected = false;

export const connectToDatabase = async (): Promise<void> => {
  if (isConnected) {
    console.log('Already connected to MongoDB');
    return;
  }

  try {
    const options = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(MONGODB_URI, options);
    isConnected = true;
    console.log('Connected to MongoDB Atlas with Mongoose');

    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    isConnected = false;
    throw error;
  }
};

export const getConnectionStatus = (): boolean => {
  return isConnected && mongoose.connection.readyState === 1;
};

export const closeDatabaseConnection = async (): Promise<void> => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('Disconnected from MongoDB Atlas');
  }
};