"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("./notification.controller");
const auth_1 = require("../../middlewares/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/me', notification_controller_1.NotificationController.getNotifications);
router.patch('/read-all', notification_controller_1.NotificationController.markAllAsRead);
router.post('/token', notification_controller_1.NotificationController.registerFcmToken);
router.delete('/token', notification_controller_1.NotificationController.unregisterFcmToken);
router.patch('/:id/read', notification_controller_1.NotificationController.markAsRead);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map