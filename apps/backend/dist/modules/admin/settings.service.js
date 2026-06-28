"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const Settings_1 = require("../../models/Settings");
class SettingsService {
    static async getSettings() {
        return Settings_1.Settings.getSingleton();
    }
    static async updateSettings(data) {
        return Settings_1.Settings.updateSettings(data);
    }
    static async getTaxRate() {
        const settings = await this.getSettings();
        return settings.taxRate;
    }
    static async getLoyaltyRate() {
        const settings = await this.getSettings();
        return settings.loyalty_points_per_100_mru;
    }
}
exports.SettingsService = SettingsService;
//# sourceMappingURL=settings.service.js.map