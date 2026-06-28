"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("./notification.controller");
const auth_1 = require("../../middlewares/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/me', notification_controller_1.NotificationController.getNotifications);
router.patch('/:id/read', notification_controller_1.NotificationController.markAsRead);
router.patch('/read-all', notification_controller_1.NotificationController.markAllAsRead);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map