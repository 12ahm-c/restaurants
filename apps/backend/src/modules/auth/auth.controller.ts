import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { sendSuccess, sendError, AppError } from '../../utils/response';

const loginSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

function handleError(res: Response, error: unknown): void {
  console.error('Auth error:', error);
  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.code, error.message);
    return;
  }
  sendError(res, 500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Internal server error');
}

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fields[e.path.join('.')] = e.message;
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
      return;
    }

    const { phone, password } = result.data;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    try {
      const { user, tokens } = await AuthService.login(phone, password, ip, userAgent);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      sendSuccess(res, {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
        refreshTokenExpiresAt: tokens.refreshTokenExpiresAt.toISOString(),
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      sendError(res, 401, 'TOKEN_INVALID', 'Refresh token required');
      return;
    }

    try {
      const tokens = await AuthService.refreshToken(refreshToken);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      sendSuccess(res, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
        refreshTokenExpiresAt: tokens.refreshTokenExpiresAt.toISOString(),
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }

    res.clearCookie('refreshToken');
    res.status(204).send();
  }

  static async me(req: Request, res: Response): Promise<void> {
    try {
      const user = await AuthService.getMe(req.user!.sub);
      sendSuccess(res, user);
    } catch (error) {
      handleError(res, error);
    }
  }
}
