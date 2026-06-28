"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("./order.controller");
const auth_1 = require("../../middlewares/auth");
const router = (0, express_1.Router)();
router.post('/orders', auth_1.authenticate, order_controller_1.OrderController.createOrder);
router.get('/orders/active', auth_1.authenticate, order_controller_1.OrderController.getActiveOrders);
router.get('/orders', auth_1.authenticate, order_controller_1.OrderController.getOrders);
router.get('/orders/:id', auth_1.authenticate, order_controller_1.OrderController.getOrderById);
router.patch('/orders/:id/status', auth_1.authenticate, order_controller_1.OrderController.updateOrderStatus);
exports.default = router;
//# sourceMappingURL=order.routes.js.map