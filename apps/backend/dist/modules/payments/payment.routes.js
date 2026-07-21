"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("./payment.controller");
const auth_1 = require("../../middlewares/auth");
const rbac_1 = require("../../middlewares/rbac");
const idempotency_1 = require("../../middlewares/idempotency");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, rbac_1.requireRole)('cashier', 'manager', 'owner'), payment_controller_1.PaymentController.getAllPayments);
router.post('/', (0, rbac_1.requireRole)('cashier', 'manager', 'owner'), idempotency_1.idempotencyMiddleware, payment_controller_1.PaymentController.processPayment);
router.get('/order/:orderId', (0, rbac_1.requireRole)('cashier', 'manager', 'owner'), payment_controller_1.PaymentController.getPaymentsByOrder);
router.post('/:paymentId/refund', (0, rbac_1.requireRole)('manager', 'owner'), payment_controller_1.PaymentController.refundPayment);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map