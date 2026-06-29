import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface SocketUser {
  userId: string;
  sub?: string;
  role: string;
  branchId?: string;
}

interface SocketData {
  user: SocketUser;
}

type TypedSocket = Socket<SocketData, SocketData, SocketData>;

let io: SocketIOServer;

export function initSocketIO(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS,
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use((socket: TypedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as SocketUser;
      socket.data.user = {
        ...decoded,
        userId: decoded.userId || decoded.sub || '',
      };
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: TypedSocket) => {
    const user = socket.data.user;
    logger.info({ userId: user.userId, role: user.role }, 'Socket.IO client connected');

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

    socket.on('kitchen_subscribe' as never, () => {
      if (user.role === 'chef' || user.role === 'manager' || user.role === 'owner') {
        socket.join('kitchen');
        logger.info({ userId: user.userId }, 'Joined kitchen room');
      }
    });

    socket.on('dashboard_subscribe' as never, () => {
      if (user.role === 'manager' || user.role === 'owner') {
        socket.join('admin');
        logger.info({ userId: user.userId }, 'Joined admin room');
      }
    });

    socket.on('disconnect', () => {
      logger.info({ userId: user.userId }, 'Socket.IO client disconnected');
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}
