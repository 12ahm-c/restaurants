import { ISettings } from '../../models/Settings';
export declare class SettingsService {
    static getSettings(): Promise<ISettings>;
    static updateSettings(data: Partial<ISettings>): Promise<ISettings>;
    static getTaxRate(): Promise<number>;
    static getLoyaltyRate(): Promise<number>;
}
//# sourceMappingURL=settings.service.d.ts.map