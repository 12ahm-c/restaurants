"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const zod_1 = require("zod");
const auth_service_1 = require("./auth.service");
const response_1 = require("../../utils/response");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
function handleError(res, error) {
    console.error('Auth error:', error);
    if (error instanceof response_1.AppError) {
        (0, response_1.sendError)(res, error.statusCode, error.code, error.message);
        return;
    }
    (0, response_1.sendError)(res, 500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Internal server error');
}
class AuthController {
    static async login(req, res) {
        const result = loginSchema.safeParse(req.body);
        if (!result.success) {
            const fields = {};
            result.error.errors.forEach((e) => {
                fields[e.path.join('.')] = e.message;
            });
            (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Validation failed', fields);
            return;
        }
        const { email, password } = result.data;
        const ip = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        try {
            const { user, tokens } = await auth_service_1.AuthService.login(email, password, ip, userAgent);
            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });
            (0, response_1.sendSuccess)(res, {
                user,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
                refreshTokenExpiresAt: tokens.refreshTokenExpiresAt.toISOString(),
            });
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async refresh(req, res) {
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
        if (!refreshToken) {
            (0, response_1.sendError)(res, 401, 'TOKEN_INVALID', 'Refresh token required');
            return;
        }
        try {
            const tokens = await auth_service_1.AuthService.refreshToken(refreshToken);
            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });
            (0, response_1.sendSuccess)(res, {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
                refreshTokenExpiresAt: tokens.refreshTokenExpiresAt.toISOString(),
            });
        }
        catch (error) {
            handleError(res, error);
        }
    }
    static async logout(req, res) {
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
        if (refreshToken) {
            await auth_service_1.AuthService.logout(refreshToken);
        }
        res.clearCookie('refreshToken');
        res.status(204).send();
    }
    static async me(req, res) {
        try {
            const user = await auth_service_1.AuthService.getMe(req.user.sub);
            (0, response_1.sendSuccess)(res, user);
        }
        catch (error) {
            handleError(res, error);
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map