"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocketIO = initSocketIO;
exports.getIO = getIO;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
let io;
function initSocketIO(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: env_1.env.CORS_ORIGINS,
            credentials: true,
        },
        path: '/socket.io',
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
            socket.data.user = {
                ...decoded,
                userId: decoded.userId || decoded.sub || '',
            };
            next();
        }
        catch (error) {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const user = socket.data.user;
        logger_1.logger.info({ userId: user.userId, role: user.role }, 'Socket.IO client connected');
        socket.join(`user:${user.userId}`);
        if (user.branchId) {
            socket.join(`branch:${user.branchId}`);
        }
        if (user.role === 'chef') {
            socket.join('kitchen');
        }
        if (user.role === 'manager' || user.role === 'owner') {
            socket.join('admin');
        }
        if (user.role === 'server') {
            socket.join('servers');
        }
        socket.on('kitchen_subscribe', () => {
            if (user.role === 'chef' || user.role === 'manager' || user.role === 'owner') {
                socket.join('kitchen');
                logger_1.logger.info({ userId: user.userId }, 'Joined kitchen room');
            }
        });
        socket.on('dashboard_subscribe', () => {
            if (user.role === 'manager' || user.role === 'owner') {
                socket.join('admin');
                logger_1.logger.info({ userId: user.userId }, 'Joined admin room');
            }
        });
        socket.on('disconnect', () => {
            logger_1.logger.info({ userId: user.userId }, 'Socket.IO client disconnected');
        });
    });
    return io;
}
function getIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
}
//# sourceMappingURL=socket.server.js.map