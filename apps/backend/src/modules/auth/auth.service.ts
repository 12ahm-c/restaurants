import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, IUser } from '../../models/User';
import { Log } from '../../models/Log';
import { redis, isRedisAvailable } from '../../config/redis';
import { env } from '../../config/env';
import { AppError } from '../../utils/response';
import mongoose from 'mongoose';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface UserDTO {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  branchId?: string;
  language: string;
  lastLogin?: string;
  createdAt: string;
}

export class AuthService {
  static async login(email: string, password: string, ip?: string, userAgent?: string): Promise<{ user: UserDTO; tokens: TokenPair }> {
    const user = await User.findOne({ email, isActive: true }).select('+passwordHash');

    if (!user) {
      throw new AppError(401, 'AUTH_REQUIRED', 'Invalid credentials');
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new AppError(401, 'AUTH_REQUIRED', 'Invalid credentials');
    }

    user.lastLogin = new Date();
    await user.save();

    const tokens = await this.generateTokenPair(user);

    await Log.createLog({
      userId: user._id,
      action: 'login',
      entity: 'User',
      entityId: user._id,
      details: { email: user.email },
      ipAddress: ip,
      userAgent,
    });

    return {
      user: this.toUserDTO(user),
      tokens,
    };
  }

  static async refreshToken(refreshToken: string): Promise<TokenPair> {
    if (!isRedisAvailable()) {
      // Without Redis, validate JWT directly
      try {
        const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string; family: string };
        const user = await User.findById(decoded.sub);
        if (!user || !user.isActive) {
          throw new AppError(401, 'TOKEN_INVALID', 'User not found or inactive');
        }
        return this.generateTokenPair(user, decoded.family);
      } catch (error) {
        throw new AppError(401, 'TOKEN_INVALID', 'Invalid refresh token');
      }
    }

    const tokenFamily = await redis.get(`refresh_token_family:${refreshToken}`);

    if (!tokenFamily) {
      throw new AppError(401, 'TOKEN_INVALID', 'Invalid refresh token');
    }

    const isReused = await redis.get(`refresh_token_reuse:${refreshToken}`);

    if (isReused) {
      await this.invalidateTokenFamily(tokenFamily);
      throw new AppError(401, 'TOKEN_INVALID', 'Refresh token reuse detected');
    }

    await redis.set(`refresh_token_reuse:${refreshToken}`, '1', 'EX', 60 * 60 * 24 * 30);

    const userId = await redis.get(`refresh_token:${refreshToken}`);

    if (!userId) {
      throw new AppError(401, 'TOKEN_INVALID', 'Invalid refresh token');
    }

    await redis.del(`refresh_token:${refreshToken}`);

    const user = await User.findById(userId);

    if (!user || !user.isActive) {
      throw new AppError(401, 'TOKEN_INVALID', 'User not found or inactive');
    }

    const newTokens = await this.generateTokenPair(user, tokenFamily);

    return newTokens;
  }

  static async logout(refreshToken: string): Promise<void> {
    if (!isRedisAvailable()) return;

    const tokenFamily = await redis.get(`refresh_token_family:${refreshToken}`);

    if (tokenFamily) {
      await this.invalidateTokenFamily(tokenFamily);
    }
  }

  static async getMe(userId: string): Promise<UserDTO> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    return this.toUserDTO(user);
  }

  private static async generateTokenPair(user: IUser, existingFamily?: string): Promise<TokenPair> {
    const family = existingFamily || uuidv4();

    const accessToken = jwt.sign(
      {
        sub: user._id.toString(),
        role: user.role,
        branchId: user.branchId?.toString(),
      },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { sub: user._id.toString(), family },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    const accessTokenDecoded = jwt.decode(accessToken) as { exp: number };
    const refreshTokenDecoded = jwt.decode(refreshToken) as { exp: number };

    const accessTokenExpiresAt = new Date(accessTokenDecoded.exp * 1000);
    const refreshTokenExpiresAt = new Date(refreshTokenDecoded.exp * 1000);

    // Store refresh token in Redis if available
    if (isRedisAvailable()) {
      const refreshTtl = Math.floor((refreshTokenExpiresAt.getTime() - Date.now()) / 1000);
      await redis.set(`refresh_token:${refreshToken}`, user._id.toString(), 'EX', refreshTtl);
      await redis.set(`refresh_token_family:${refreshToken}`, family, 'EX', refreshTtl);
    }

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    };
  }

  private static async invalidateTokenFamily(family: string): Promise<void> {
    if (!isRedisAvailable()) return;
    
    const keys = await redis.keys(`refresh_token_family:${family}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  static toUserDTO(user: IUser): UserDTO {
    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      branchId: user.branchId?.toString(),
      language: user.language,
      lastLogin: user.lastLogin?.toISOString(),
      createdAt: user.createdAt.toISOString(),
    };
  }
}
