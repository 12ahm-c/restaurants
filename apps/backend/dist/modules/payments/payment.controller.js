"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const payment_service_1 = require("./payment.service");
class PaymentController {
    static async processPayment(req, res) {
        try {
            const { orderId, amount, method, cashGiven } = req.body;
            const userId = req.user._id;
            const result = await payment_service_1.PaymentService.processPayment({
                orderId,
                amount,
                method,
                cashGiven,
                userId,
            });
            res.status(201).json(result);
        }
        catch (error) {
            const status = error.status || 500;
            res.status(status).json({ message: error.message || 'Failed to process payment' });
        }
    }
    static async getCashDrawer(req, res) {
        try {
            const { branchId } = req.query;
            const drawer = await payment_service_1.PaymentService.getCashDrawer(branchId);
            if (!drawer) {
                res.status(404).json({ message: 'No open cash drawer found' });
                return;
            }
            res.json(drawer);
        }
        catch (error) {
            res.status(500).json({ message: error.message || 'Failed to get cash drawer' });
        }
    }
    static async openCashDrawer(req, res) {
        try {
            const { branchId, openingBalance } = req.body;
            const userId = req.user._id;
            const drawer = await payment_service_1.PaymentService.openCashDrawer(branchId, openingBalance, userId);
            res.status(201).json(drawer);
        }
        catch (error) {
            const status = error.status || 500;
            res.status(status).json({ message: error.message || 'Failed to open cash drawer' });
        }
    }
    static async closeCashDrawer(req, res) {
        try {
            const { drawerId, declaredBalance } = req.body;
            const userId = req.user._id;
            const result = await payment_service_1.PaymentService.closeCashDrawer(drawerId, declaredBalance, userId);
            res.json(result);
        }
        catch (error) {
            const status = error.status || 500;
            res.status(status).json({ message: error.message || 'Failed to close cash drawer' });
        }
    }
    static async getPaymentsByOrder(req, res) {
        try {
            const { orderId } = req.params;
            const payments = await payment_service_1.PaymentService.getPaymentsByOrder(orderId);
            res.json(payments);
        }
        catch (error) {
            res.status(500).json({ message: error.message || 'Failed to get payments' });
        }
    }
    static async refundPayment(req, res) {
        try {
            const { paymentId } = req.params;
            const payment = await payment_service_1.PaymentService.refundPayment(paymentId);
            res.json(payment);
        }
        catch (error) {
            const status = error.status || 500;
            res.status(status).json({ message: error.message || 'Failed to refund payment' });
        }
    }
}
exports.PaymentController = PaymentController;
//# sourceMappingURL=payment.controller.js.map