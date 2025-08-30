import mongoose, { ConnectOptions } from 'mongoose';

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionId: string | null;
}

const connectionState: ConnectionState = {
  isConnected: false,
  isConnecting: false,
  connectionId: null,
};

/**
 * Connects to MongoDB Atlas database using Mongoose
 * Retrieves connection string from MONGO_URI environment variable
 * Includes comprehensive error handling and connection management
 */
export const connectToMongoDB = async (): Promise<void> => {
  try {
    // Check if already connected
    if (connectionState.isConnected && mongoose.connection.readyState === 1) {
      console.log('✅ Already connected to MongoDB Atlas');
      return;
    }

    // Check if connection is in progress
    if (connectionState.isConnecting) {
      console.log('⏳ Connection to MongoDB Atlas in progress...');
      return;
    }

    // Get MongoDB URI from environment variables
    const MONGO_URI = process.env.MONGO_URI;
    
    // Validate environment variable
    if (!MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not defined');
    }

    if (!MONGO_URI.startsWith('mongodb://') && !MONGO_URI.startsWith('mongodb+srv://')) {
      throw new Error('Invalid MONGO_URI format. Must start with mongodb:// or mongodb+srv://');
    }

    console.log('🔗 Connecting to MongoDB Atlas...');
    connectionState.isConnecting = true;

    // Connection options for optimal performance and reliability
    const options: ConnectOptions = {
      maxPoolSize: 10, // Maximum number of connections in the pool
      serverSelectionTimeoutMS: 5000, // How long to wait for server selection
      socketTimeoutMS: 45000, // How long to wait for socket to timeout
      family: 4, // Use IPv4, skip trying IPv6
      bufferCommands: false, // Disable mongoose buffering
    };

    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, options);

    // Update connection state
    connectionState.isConnected = true;
    connectionState.isConnecting = false;
    connectionState.connectionId = String(mongoose.connection.id) || 'unknown';

    // Success message with connection details
    const dbName = mongoose.connection.db?.databaseName || 'unknown';
    const host = mongoose.connection.host || 'unknown';
    
    console.log('🎉 Successfully connected to MongoDB Atlas!');
    console.log(`📊 Database: ${dbName}`);
    console.log(`🌐 Host: ${host}`);
    console.log(`🔌 Connection ID: ${connectionState.connectionId}`);
    console.log(`📈 Ready State: ${mongoose.connection.readyState}`);

    // Set up connection event listeners
    setupConnectionEventListeners();

  } catch (error) {
    connectionState.isConnecting = false;
    connectionState.isConnected = false;

    // Enhanced error handling with specific error types
    if (error instanceof Error) {
      console.error('❌ MongoDB connection failed:', error.message);
      
      // Handle specific MongoDB errors
      if (error.message.includes('ENOTFOUND')) {
        console.error('🌐 Network error: Unable to resolve MongoDB host');
      } else if (error.message.includes('authentication')) {
        console.error('🔐 Authentication error: Check your MongoDB credentials');
      } else if (error.message.includes('timeout')) {
        console.error('⏰ Connection timeout: MongoDB server not responding');
      } else if (error.message.includes('MONGO_URI')) {
        console.error('⚙️  Environment error: Check your MONGO_URI variable');
      }
    } else {
      console.error('❌ Unknown error during MongoDB connection:', error);
    }

    // Re-throw the error for upstream handling
    throw error;
  }
};

/**
 * Sets up event listeners for MongoDB connection
 * Handles disconnections, errors, and reconnections
 */
const setupConnectionEventListeners = (): void => {
  // Connection error handler
  mongoose.connection.on('error', (error) => {
    console.error('🚨 MongoDB connection error:', error);
    connectionState.isConnected = false;
  });

  // Disconnection handler
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
    connectionState.isConnected = false;
    connectionState.connectionId = null;
  });

  // Reconnection handler
  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected');
    connectionState.isConnected = true;
    connectionState.connectionId = String(mongoose.connection.id) || 'unknown';
  });

  // Process termination handlers
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
};

/**
 * Returns the current connection status
 */
export const getConnectionStatus = (): ConnectionState & { readyState: number } => {
  return {
    ...connectionState,
    readyState: mongoose.connection.readyState,
  };
};

/**
 * Checks if MongoDB is connected and ready
 */
export const isMongoConnected = (): boolean => {
  return connectionState.isConnected && mongoose.connection.readyState === 1;
};

/**
 * Gracefully closes the MongoDB connection
 */
export const disconnectFromMongoDB = async (): Promise<void> => {
  try {
    if (connectionState.isConnected) {
      await mongoose.disconnect();
      connectionState.isConnected = false;
      connectionState.connectionId = null;
      console.log('👋 Successfully disconnected from MongoDB Atlas');
    } else {
      console.log('ℹ️  MongoDB was not connected');
    }
  } catch (error) {
    console.error('❌ Error during MongoDB disconnection:', error);
    throw error;
  }
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (): Promise<void> => {
  console.log('🛑 Graceful shutdown initiated...');
  try {
    await disconnectFromMongoDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Export the main connection function as default
export default connectToMongoDB;