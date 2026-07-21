"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('3001'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    MONGODB_URI: zod_1.z.string().default('mongodb://localhost:27017/restomanager'),
    REDIS_URL: zod_1.z.string().default('redis://localhost:6379'),
    JWT_SECRET: zod_1.z.string().min(1, 'JWT_SECRET is required'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(1, 'JWT_REFRESH_SECRET is required'),
    JWT_ACCESS_EXPIRY: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRY: zod_1.z.string().default('30d'),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:3000'),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().default('900000'),
    RATE_LIMIT_MAX: zod_1.z.string().default('100'),
    LOGIN_RATE_LIMIT_MAX: zod_1.z.string().default('5'),
    LOGIN_RATE_LIMIT_WINDOW_MS: zod_1.z.string().default('900000'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = {
    ...parsed.data,
    PORT: parseInt(parsed.data.PORT, 10),
    RATE_LIMIT_WINDOW_MS: parseInt(parsed.data.RATE_LIMIT_WINDOW_MS, 10),
    RATE_LIMIT_MAX: parseInt(parsed.data.RATE_LIMIT_MAX, 10),
    LOGIN_RATE_LIMIT_MAX: parseInt(parsed.data.LOGIN_RATE_LIMIT_MAX, 10),
    LOGIN_RATE_LIMIT_WINDOW_MS: parseInt(parsed.data.LOGIN_RATE_LIMIT_WINDOW_MS, 10),
    CORS_ORIGINS: parsed.data.CORS_ORIGIN.split(',').map((s) => s.trim()),
};
//# sourceMappingURL=env.js.map