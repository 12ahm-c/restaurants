"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kitchen_controller_1 = require("./kitchen.controller");
const auth_1 = require("../../middlewares/auth");
const rbac_1 = require("../../middlewares/rbac");
const router = (0, express_1.Router)();
router.get('/kitchen/queue', auth_1.authenticate, (0, rbac_1.requireRole)('chef', 'manager', 'owner'), kitchen_controller_1.KitchenController.getQueue);
router.get('/kitchen/queue/priority', auth_1.authenticate, (0, rbac_1.requireRole)('chef', 'manager', 'owner'), kitchen_controller_1.KitchenController.getPriorityQueue);
router.patch('/kitchen/queue/:id/start', auth_1.authenticate, (0, rbac_1.requireRole)('chef', 'manager', 'owner'), kitchen_controller_1.KitchenController.startPreparation);
router.patch('/kitchen/queue/:id/ready', auth_1.authenticate, (0, rbac_1.requireRole)('chef', 'manager', 'owner'), kitchen_controller_1.KitchenController.markReady);
router.post('/orders/:id/cancel', auth_1.authenticate, (0, rbac_1.requireRole)('manager', 'owner'), kitchen_controller_1.KitchenController.cancelOrder);
exports.default = router;
//# sourceMappingURL=kitchen.routes.js.map