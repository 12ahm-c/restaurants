"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const User_1 = require("../../models/User");
const Log_1 = require("../../models/Log");
const redis_1 = require("../../config/redis");
const env_1 = require("../../config/env");
const response_1 = require("../../utils/response");
class AuthService {
    static async login(phone, password, ip, userAgent) {
        const user = await User_1.User.findOne({ phone, isActive: true }).select('+passwordHash');
        if (!user) {
            throw new response_1.AppError(401, 'AUTH_REQUIRED', 'Invalid credentials');
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new response_1.AppError(401, 'AUTH_REQUIRED', 'Invalid credentials');
        }
        user.lastLogin = new Date();
        await user.save();
        const tokens = await this.generateTokenPair(user);
        await Log_1.Log.createLog({
            userId: user._id,
            action: 'login',
            entity: 'User',
            entityId: user._id,
            details: { phone: user.phone },
            ipAddress: ip,
            userAgent,
        });
        return {
            user: this.toUserDTO(user),
            tokens,
        };
    }
    static async refreshToken(refreshToken) {
        if (!(0, redis_1.isRedisAvailable)()) {
            try {
                const decoded = jsonwebtoken_1.default.verify(refreshToken, env_1.env.JWT_REFRESH_SECRET);
                const user = await User_1.User.findById(decoded.sub);
                if (!user || !user.isActive) {
                    throw new response_1.AppError(401, 'TOKEN_INVALID', 'User not found or inactive');
                }
                return this.generateTokenPair(user, decoded.family);
            }
            catch (error) {
                throw new response_1.AppError(401, 'TOKEN_INVALID', 'Invalid refresh token');
            }
        }
        const tokenFamily = await redis_1.redis.get(`refresh_token_family:${refreshToken}`);
        if (!tokenFamily) {
            throw new response_1.AppError(401, 'TOKEN_INVALID', 'Invalid refresh token');
        }
        const isReused = await redis_1.redis.get(`refresh_token_reuse:${refreshToken}`);
        if (isReused) {
            await this.invalidateTokenFamily(tokenFamily);
            throw new response_1.AppError(401, 'TOKEN_INVALID', 'Refresh token reuse detected');
        }
        await redis_1.redis.set(`refresh_token_reuse:${refreshToken}`, '1', 'EX', 60 * 60 * 24 * 30);
        const userId = await redis_1.redis.get(`refresh_token:${refreshToken}`);
        if (!userId) {
            throw new response_1.AppError(401, 'TOKEN_INVALID', 'Invalid refresh token');
        }
        await redis_1.redis.del(`refresh_token:${refreshToken}`);
        const user = await User_1.User.findById(userId);
        if (!user || !user.isActive) {
            throw new response_1.AppError(401, 'TOKEN_INVALID', 'User not found or inactive');
        }
        const newTokens = await this.generateTokenPair(user, tokenFamily);
        return newTokens;
    }
    static async logout(refreshToken) {
        if (!(0, redis_1.isRedisAvailable)())
            return;
        const tokenFamily = await redis_1.redis.get(`refresh_token_family:${refreshToken}`);
        if (tokenFamily) {
            await this.invalidateTokenFamily(tokenFamily);
        }
    }
    static async getMe(userId) {
        const user = await User_1.User.findById(userId);
        if (!user) {
            throw new response_1.AppError(404, 'NOT_FOUND', 'User not found');
        }
        return this.toUserDTO(user);
    }
    static async generateTokenPair(user, existingFamily) {
        const family = existingFamily || (0, uuid_1.v4)();
        const accessToken = jsonwebtoken_1.default.sign({
            sub: user._id.toString(),
            role: user.role,
            branchId: user.branchId?.toString(),
        }, env_1.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ sub: user._id.toString(), family }, env_1.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
        const accessTokenDecoded = jsonwebtoken_1.default.decode(accessToken);
        const refreshTokenDecoded = jsonwebtoken_1.default.decode(refreshToken);
        const accessTokenExpiresAt = new Date(accessTokenDecoded.exp * 1000);
        const refreshTokenExpiresAt = new Date(refreshTokenDecoded.exp * 1000);
        if ((0, redis_1.isRedisAvailable)()) {
            const refreshTtl = Math.floor((refreshTokenExpiresAt.getTime() - Date.now()) / 1000);
            await redis_1.redis.set(`refresh_token:${refreshToken}`, user._id.toString(), 'EX', refreshTtl);
            await redis_1.redis.set(`refresh_token_family:${refreshToken}`, family, 'EX', refreshTtl);
        }
        return {
            accessToken,
            refreshToken,
            accessTokenExpiresAt,
            refreshTokenExpiresAt,
        };
    }
    static async invalidateTokenFamily(family) {
        if (!(0, redis_1.isRedisAvailable)())
            return;
        const keys = await redis_1.redis.keys(`refresh_token_family:${family}:*`);
        if (keys.length > 0) {
            await redis_1.redis.del(...keys);
        }
    }
    static toUserDTO(user) {
        return {
            _id: user._id.toString(),
            name: user.name,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            branchId: user.branchId?.toString(),
            language: user.language,
            lastLogin: user.lastLogin?.toISOString(),
            createdAt: user.createdAt.toISOString(),
        };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map