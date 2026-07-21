import mongoose from 'mongoose';
import { User } from './models/User';
import { logger } from './utils/logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resto_manager';

const users = [
  { name: 'Admin', phone: '0000000000', passwordHash: 'admin123', role: 'owner' as const, language: 'fr' },
  { name: 'Manager', phone: '1111111111', passwordHash: 'manager123', role: 'manager' as const, language: 'fr' },
  { name: 'Cashier', phone: '2222222222', passwordHash: 'cashier123', role: 'cashier' as const, language: 'fr' },
  { name: 'Server', phone: '3333333333', passwordHash: 'server123', role: 'server' as const, language: 'fr' },
  { name: 'Chef', phone: '4444444444', passwordHash: 'chef123', role: 'chef' as const, language: 'fr' },
];

async function seedUsers() {
  await mongoose.connect(MONGODB_URI);
  logger.info('Connected to MongoDB');

  const db = mongoose.connection.db!;
  const indexes = await db.collection('users').indexes();
  for (const idx of indexes) {
    if (idx.name !== '_id_' && idx.key && 'email' in idx.key) {
      await db.collection('users').dropIndex(idx.name!);
      logger.info(`Dropped stale index: ${idx.name}`);
    }
  }

  for (const userData of users) {
    try {
      const existing = await User.findOne({ phone: userData.phone });
      if (existing) {
        logger.info(`User ${userData.name} (${userData.phone}) already exists, skipping`);
        continue;
      }
      const user = new User(userData);
      await user.save();
      logger.info(`Created user: ${userData.name} (${userData.phone}) - role: ${userData.role}`);
    } catch (err: any) {
      logger.error(`Failed to create ${userData.name}: ${err.message}`);
    }
  }

  logger.info('Done!');
  await mongoose.disconnect();
}

seedUsers();
