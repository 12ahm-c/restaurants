import { Request, Response } from 'express';
import { SettingsService } from './settings.service';
import { Log } from '../../models/Log';

export class SettingsController {
  static async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await SettingsService.getSettings();
      res.json({ success: true, data: settings });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get settings' });
    }
  }

  static async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.sub;
      const updateData = req.body;

      const settings = await SettingsService.updateSettings(updateData);

      if (userId) {
        await Log.createLog({
          userId,
          action: 'UPDATE',
          entity: 'Settings',
          entityId: settings._id,
          details: { updatedFields: Object.keys(updateData) },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }).catch(() => {});
      }

      res.json({ success: true, data: settings });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to update settings' });
    }
  }
}
