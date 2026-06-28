import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('Connected to MongoDB');
  } catch (error: unknown) {
    logger.error({ err: error }, 'Failed to connect to MongoDB');
    process.exit(1);
  }

  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error:', error);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });
}

export async function disconnectMongoDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB');
}
