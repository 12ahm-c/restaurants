"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const settings_service_1 = require("./settings.service");
const Log_1 = require("../../models/Log");
class SettingsController {
    static async getSettings(req, res) {
        try {
            const settings = await settings_service_1.SettingsService.getSettings();
            res.json({ success: true, data: settings });
        }
        catch (error) {
            res.status(500).json({ message: error.message || 'Failed to get settings' });
        }
    }
    static async updateSettings(req, res) {
        try {
            const userId = req.user._id;
            const updateData = req.body;
            const settings = await settings_service_1.SettingsService.updateSettings(updateData);
            await Log_1.Log.createLog({
                userId,
                action: 'UPDATE',
                entity: 'Settings',
                entityId: settings._id,
                details: { updatedFields: Object.keys(updateData) },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });
            res.json({ success: true, data: settings });
        }
        catch (error) {
            res.status(500).json({ message: error.message || 'Failed to update settings' });
        }
    }
}
exports.SettingsController = SettingsController;
//# sourceMappingURL=settings.controller.js.map