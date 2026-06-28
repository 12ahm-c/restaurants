"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
const BACKUP_DIR = path_1.default.join(process.cwd(), 'backups');
const MAX_BACKUP_DAYS = 7;
class BackupService {
    static async createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path_1.default.join(BACKUP_DIR, `backup-${timestamp}.json`);
        if (!fs_1.default.existsSync(BACKUP_DIR)) {
            fs_1.default.mkdirSync(BACKUP_DIR, { recursive: true });
        }
        const collections = await mongoose_1.default.connection.db?.listCollections().toArray();
        if (!collections) {
            throw new Error('No database connection');
        }
        const backupData = {};
        for (const collection of collections) {
            const data = await mongoose_1.default.connection.db?.collection(collection.name).find({}).toArray();
            backupData[collection.name] = data || [];
        }
        fs_1.default.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
        logger_1.logger.info({ backupPath }, 'Backup created');
        await this.cleanOldBackups();
        return backupPath;
    }
    static async cleanOldBackups() {
        if (!fs_1.default.existsSync(BACKUP_DIR))
            return;
        const files = fs_1.default.readdirSync(BACKUP_DIR);
        const now = new Date();
        for (const file of files) {
            if (!file.startsWith('backup-'))
                continue;
            const filePath = path_1.default.join(BACKUP_DIR, file);
            const stats = fs_1.default.statSync(filePath);
            const daysOld = (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
            if (daysOld > MAX_BACKUP_DAYS) {
                fs_1.default.unlinkSync(filePath);
                logger_1.logger.info({ file }, 'Old backup removed');
            }
        }
    }
    static getBackupDir() {
        return BACKUP_DIR;
    }
    static listBackups() {
        if (!fs_1.default.existsSync(BACKUP_DIR))
            return [];
        return fs_1.default.readdirSync(BACKUP_DIR).filter(f => f.startsWith('backup-'));
    }
    static async restoreBackup(backupPath) {
        if (!fs_1.default.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const backupData = JSON.parse(fs_1.default.readFileSync(backupPath, 'utf-8'));
        const db = mongoose_1.default.connection.db;
        if (!db) {
            throw new Error('No database connection');
        }
        for (const [collectionName, documents] of Object.entries(backupData)) {
            if (!Array.isArray(documents) || documents.length === 0)
                continue;
            const collection = db.collection(collectionName);
            await collection.deleteMany({});
            await collection.insertMany(documents);
            logger_1.logger.info({ collection: collectionName, count: documents.length }, 'Collection restored');
        }
        logger_1.logger.info({ backupPath }, 'Backup restored successfully');
    }
}
exports.BackupService = BackupService;
//# sourceMappingURL=backup.service.js.map