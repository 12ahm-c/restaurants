import { Request, Response } from 'express';
import { LogService } from './log.service';

export class AdminController {
  static async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const { cursor, limit, userId, action, from, to } = req.query;

      const result = await LogService.getLogs({
        cursor: cursor as string,
        limit: limit ? parseInt(limit as string) : 50,
        userId: userId as string,
        action: action as string,
        from: from as string,
        to: to as string,
      });

      res.json({
        success: true,
        data: result.logs,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get logs' });
    }
  }
}
