import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const MAX_BACKUP_DAYS = 7;

export class BackupService {
  static async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}.json`);

    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const collections = await mongoose.connection.db?.listCollections().toArray();
    if (!collections) {
      throw new Error('No database connection');
    }

    const backupData: Record<string, any[]> = {};

    for (const collection of collections) {
      const data = await mongoose.connection.db?.collection(collection.name).find({}).toArray();
      backupData[collection.name] = data || [];
    }

    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    logger.info({ backupPath }, 'Backup created');

    await this.cleanOldBackups();

    return backupPath;
  }

  static async cleanOldBackups(): Promise<void> {
    if (!fs.existsSync(BACKUP_DIR)) return;

    const files = fs.readdirSync(BACKUP_DIR);
    const now = new Date();

    for (const file of files) {
      if (!file.startsWith('backup-')) continue;

      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const daysOld = (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

      if (daysOld > MAX_BACKUP_DAYS) {
        fs.unlinkSync(filePath);
        logger.info({ file }, 'Old backup removed');
      }
    }
  }

  static getBackupDir(): string {
    return BACKUP_DIR;
  }

  static listBackups(): string[] {
    if (!fs.existsSync(BACKUP_DIR)) return [];
    return fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('backup-'));
  }

  static async restoreBackup(backupPath: string): Promise<void> {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('No database connection');
    }

    for (const [collectionName, documents] of Object.entries(backupData)) {
      if (!Array.isArray(documents) || documents.length === 0) continue;

      const collection = db.collection(collectionName);
      await collection.deleteMany({});
      await collection.insertMany(documents as any[]);
      logger.info({ collection: collectionName, count: documents.length }, 'Collection restored');
    }

    logger.info({ backupPath }, 'Backup restored successfully');
  }
}
