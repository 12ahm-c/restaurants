export declare class BackupService {
    static createBackup(): Promise<string>;
    static cleanOldBackups(): Promise<void>;
    static getBackupDir(): string;
    static listBackups(): string[];
    static restoreBackup(backupPath: string): Promise<void>;
}
//# sourceMappingURL=backup.service.d.ts.map