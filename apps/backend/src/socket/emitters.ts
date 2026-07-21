import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';

export interface NewOrderEvent {
  orderId: string;
  tentName: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  priority: number;
  timestamp: Date;
}

export interface OrderStatusUpdateEvent {
  orderId: string;
  status: string;
  tentName: string;
  timestamp: Date;
}

export interface OrderCancelledEvent {
  orderId: string;
  reason: string;
  timestamp: Date;
}

export interface SaleNewEvent {
  orderId: string;
  totalAmount: number;
  cashierName: string;
  timestamp: Date;
}

export interface StockCriticalEvent {
  inventoryId: string;
  productName: string;
  quantity: number;
  threshold: number;
  alertId: string;
}

export interface DashboardUpdateEvent {
  dailyOrdersCount: number;
  dailyRevenue: number;
  activeTables: number;
  pendingKitchenOrders: number;
  alertsCount: number;
}

export interface CustomerPointsEarnedEvent {
  customerId: string;
  customerName: string;
  points: number;
  totalPoints: number;
  orderId: string;
}

export interface CustomerPointsRedeemedEvent {
  customerId: string;
  customerName: string;
  points: number;
  discountAmount: number;
  remainingPoints: number;
}

export interface NotificationNewEvent {
  userId: string;
  notificationId: string;
  title: string;
  message: string;
  type: string;
  createdAt: Date;
}

export function emitNewOrder(io: SocketIOServer, data: NewOrderEvent): void {
  io.to('kitchen').emit('order:new', data);
  io.to('admin').emit('order:new', data);
  io.to('servers').emit('order:new', data);
  logger.info({ orderId: data.orderId }, 'Emitted order:new to kitchen + admin + servers');
}

export function emitOrderStatusUpdate(
  io: SocketIOServer,
  data: OrderStatusUpdateEvent,
  serverId?: string
): void {
  if (serverId) {
    io.to(`user:${serverId}`).emit('order:status-update', data);
  }
  io.to('kitchen').emit('order:status-update', data);
  io.to('admin').emit('order:status-update', data);
  io.to('servers').emit('order:status-update', data);
  logger.info({ orderId: data.orderId, status: data.status }, 'Emitted order:status-update');
}

export function emitOrderCancelled(io: SocketIOServer, data: OrderCancelledEvent): void {
  io.to('kitchen').emit('order:cancelled', data);
  io.to('admin').emit('order:cancelled', data);
  io.to('servers').emit('order:cancelled', data);
  logger.info({ orderId: data.orderId }, 'Emitted order:cancelled to kitchen + admin + servers');
}

export function emitSaleNew(io: SocketIOServer, data: SaleNewEvent): void {
  io.to('admin').emit('sale:new', data);
  logger.info({ orderId: data.orderId }, 'Emitted sale:new to admin');
}

export function emitStockCritical(io: SocketIOServer, data: StockCriticalEvent): void {
  io.to('admin').emit('alert:stock_critical', data);
  logger.warn({ inventoryId: data.inventoryId }, 'Emitted alert:stock_critical');
}

export function emitDashboardUpdate(io: SocketIOServer, data: DashboardUpdateEvent): void {
  io.to('admin').emit('dashboard:update', data);
}

export function emitCustomerPointsEarned(io: SocketIOServer, data: CustomerPointsEarnedEvent): void {
  io.to('admin').emit('customer:points_earned', data);
  logger.info({ customerId: data.customerId, points: data.points }, 'Emitted customer:points_earned');
}

export function emitCustomerPointsRedeemed(io: SocketIOServer, data: CustomerPointsRedeemedEvent): void {
  io.to('admin').emit('customer:points_redeemed', data);
  logger.info({ customerId: data.customerId, points: data.points }, 'Emitted customer:points_redeemed');
}

export function emitNotificationNew(io: SocketIOServer, data: NotificationNewEvent): void {
  io.to(`user:${data.userId}`).emit('notification:new', data);
  logger.info({ notificationId: data.notificationId, userId: data.userId }, 'Emitted notification:new');
}
