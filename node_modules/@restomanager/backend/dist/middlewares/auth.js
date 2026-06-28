"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const response_1 = require("../utils/response");
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        (0, response_1.sendError)(res, 401, 'AUTH_REQUIRED', 'Access token required');
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            (0, response_1.sendError)(res, 401, 'TOKEN_EXPIRED', 'Access token expired');
            return;
        }
        (0, response_1.sendError)(res, 401, 'TOKEN_INVALID', 'Invalid access token');
    }
}
function optionalAuth(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = decoded;
    }
    catch {
        // Token invalid, continue without user
    }
    next();
}
//# sourceMappingURL=auth.js.map