import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
export interface SocketUser {
    userId: string;
    sub?: string;
    role: string;
    branchId?: string;
}
export declare function initSocketIO(httpServer: HTTPServer): SocketIOServer;
export declare function getIO(): SocketIOServer;
//# sourceMappingURL=socket.server.d.ts.map