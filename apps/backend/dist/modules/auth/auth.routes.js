"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_controller_1 = require("./auth.controller");
const auth_1 = require("../../middlewares/auth");
const env_1 = require("../../config/env");
const User_1 = require("../../models/User");
const router = (0, express_1.Router)();
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.LOGIN_RATE_LIMIT_WINDOW_MS,
    max: env_1.env.LOGIN_RATE_LIMIT_MAX,
    message: {
        success: false,
        data: null,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many login attempts, please try again later',
        },
        meta: null,
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Setup: Create first admin user (only if no users exist)
router.post('/setup', async (_req, res) => {
    try {
        const userCount = await User_1.User.countDocuments();
        if (userCount > 0) {
            res.status(400).json({
                success: false,
                data: null,
                error: { code: 'USERS_EXIST', message: 'Users already exist. Use login instead.' },
                meta: null,
            });
            return;
        }
        const user = await User_1.User.create({
            name: 'Admin',
            email: 'admin@restomanager.com',
            passwordHash: 'admin123',
            role: 'owner',
            isActive: true,
            language: 'fr',
        });
        res.status(201).json({
            success: true,
            data: { message: 'Admin user created', email: 'admin@restomanager.com' },
            error: null,
            meta: null,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            error: { code: 'SETUP_ERROR', message: error.message },
            meta: null,
        });
    }
});
router.post('/login', loginLimiter, auth_controller_1.AuthController.login);
router.post('/refresh', auth_controller_1.AuthController.refresh);
router.post('/logout', auth_controller_1.AuthController.logout);
router.get('/me', auth_1.authenticate, auth_controller_1.AuthController.me);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map