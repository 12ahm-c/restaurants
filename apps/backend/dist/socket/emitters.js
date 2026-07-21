"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitNewOrder = emitNewOrder;
exports.emitOrderStatusUpdate = emitOrderStatusUpdate;
exports.emitOrderCancelled = emitOrderCancelled;
exports.emitSaleNew = emitSaleNew;
exports.emitStockCritical = emitStockCritical;
exports.emitDashboardUpdate = emitDashboardUpdate;
exports.emitCustomerPointsEarned = emitCustomerPointsEarned;
exports.emitCustomerPointsRedeemed = emitCustomerPointsRedeemed;
exports.emitNotificationNew = emitNotificationNew;
const logger_1 = require("../utils/logger");
function emitNewOrder(io, data) {
    io.to('kitchen').emit('order:new', data);
    io.to('admin').emit('order:new', data);
    io.to('servers').emit('order:new', data);
    logger_1.logger.info({ orderId: data.orderId }, 'Emitted order:new to kitchen + admin + servers');
}
function emitOrderStatusUpdate(io, data, serverId) {
    if (serverId) {
        io.to(`user:${serverId}`).emit('order:status-update', data);
    }
    io.to('kitchen').emit('order:status-update', data);
    io.to('admin').emit('order:status-update', data);
    io.to('servers').emit('order:status-update', data);
    logger_1.logger.info({ orderId: data.orderId, status: data.status }, 'Emitted order:status-update');
}
function emitOrderCancelled(io, data) {
    io.to('kitchen').emit('order:cancelled', data);
    io.to('admin').emit('order:cancelled', data);
    io.to('servers').emit('order:cancelled', data);
    logger_1.logger.info({ orderId: data.orderId }, 'Emitted order:cancelled to kitchen + admin + servers');
}
function emitSaleNew(io, data) {
    io.to('admin').emit('sale:new', data);
    logger_1.logger.info({ orderId: data.orderId }, 'Emitted sale:new to admin');
}
function emitStockCritical(io, data) {
    io.to('admin').emit('alert:stock_critical', data);
    logger_1.logger.warn({ inventoryId: data.inventoryId }, 'Emitted alert:stock_critical');
}
function emitDashboardUpdate(io, data) {
    io.to('admin').emit('dashboard:update', data);
}
function emitCustomerPointsEarned(io, data) {
    io.to('admin').emit('customer:points_earned', data);
    logger_1.logger.info({ customerId: data.customerId, points: data.points }, 'Emitted customer:points_earned');
}
function emitCustomerPointsRedeemed(io, data) {
    io.to('admin').emit('customer:points_redeemed', data);
    logger_1.logger.info({ customerId: data.customerId, points: data.points }, 'Emitted customer:points_redeemed');
}
function emitNotificationNew(io, data) {
    io.to(`user:${data.userId}`).emit('notification:new', data);
    logger_1.logger.info({ notificationId: data.notificationId, userId: data.userId }, 'Emitted notification:new');
}
//# sourceMappingURL=emitters.js.map