"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middlewares/errorHandler");
const socket_server_1 = require("./socket/socket.server");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const user_routes_1 = __importDefault(require("./modules/users/user.routes"));
const table_routes_1 = __importDefault(require("./modules/tables/table.routes"));
const menu_routes_1 = __importDefault(require("./modules/menu/menu.routes"));
const order_routes_1 = __importDefault(require("./modules/orders/order.routes"));
const kitchen_routes_1 = __importDefault(require("./modules/kitchen/kitchen.routes"));
const inventory_routes_1 = __importDefault(require("./modules/inventory/inventory.routes"));
const customer_routes_1 = __importDefault(require("./modules/customer/customer.routes"));
const payment_routes_1 = __importDefault(require("./modules/payments/payment.routes"));
const dashboard_routes_1 = __importDefault(require("./modules/dashboard/dashboard.routes"));
const reports_routes_1 = __importDefault(require("./modules/reports/reports.routes"));
const notification_routes_1 = __importDefault(require("./modules/notifications/notification.routes"));
const supplier_routes_1 = __importDefault(require("./modules/suppliers/supplier.routes"));
const admin_routes_1 = __importDefault(require("./modules/admin/admin.routes"));
const health_routes_1 = __importDefault(require("./modules/health/health.routes"));
const health_service_1 = require("./modules/health/health.service");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = (0, socket_server_1.initSocketIO)(httpServer);
exports.io = io;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: env_1.env.CORS_ORIGIN, credentials: true }));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use('/uploads', express_1.default.static('uploads'));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// Request counting middleware
app.use((_req, _res, next) => {
    health_service_1.healthService.incrementRequests();
    next();
});
app.use(health_routes_1.default);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/v1/auth', auth_routes_1.default);
app.use('/v1/users', user_routes_1.default);
app.use('/v1/admin', user_routes_1.default);
app.use('/v1', table_routes_1.default);
app.use('/v1', menu_routes_1.default);
app.use('/v1', order_routes_1.default);
app.use('/v1', kitchen_routes_1.default);
app.use('/v1', inventory_routes_1.default);
app.use('/v1', customer_routes_1.default);
app.use('/v1/payments', payment_routes_1.default);
app.use('/v1/dashboard', dashboard_routes_1.default);
app.use('/v1/reports', reports_routes_1.default);
app.use('/v1/notifications', notification_routes_1.default);
app.use('/v1', supplier_routes_1.default);
app.use('/v1/admin', admin_routes_1.default);
app.use(errorHandler_1.errorHandler);
async function start() {
    try {
        await (0, db_1.connectMongoDB)();
        logger_1.logger.info('MongoDB connected');
        httpServer.listen(env_1.env.PORT, () => {
            logger_1.logger.info(`Server running on port ${env_1.env.PORT}`);
        });
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Failed to start server');
        process.exit(1);
    }
}
start();
exports.default = app;
//# sourceMappingURL=server.js.map