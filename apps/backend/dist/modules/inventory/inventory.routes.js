"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_controller_1 = require("./inventory.controller");
const auth_1 = require("../../middlewares/auth");
const rbac_1 = require("../../middlewares/rbac");
const idempotency_1 = require("../../middlewares/idempotency");
const router = (0, express_1.Router)();
router.get('/inventory/stock-value', auth_1.authenticate, (0, rbac_1.requireRole)('owner', 'manager'), inventory_controller_1.InventoryController.getStockValue);
router.get('/inventory/alerts', auth_1.authenticate, (0, rbac_1.requireRole)('owner', 'manager'), inventory_controller_1.InventoryController.getStockAlerts);
router.get('/inventory/:id/movements', auth_1.authenticate, inventory_controller_1.InventoryController.getStockMovements);
router.get('/inventory/:id', auth_1.authenticate, inventory_controller_1.InventoryController.getInventoryById);
router.get('/inventory', auth_1.authenticate, inventory_controller_1.InventoryController.getInventory);
router.post('/inventory', auth_1.authenticate, (0, rbac_1.requireRole)('owner', 'manager'), inventory_controller_1.InventoryController.createInventory);
router.patch('/inventory/:id/adjust', auth_1.authenticate, (0, rbac_1.requireRole)('owner', 'manager', 'stock_manager'), idempotency_1.idempotencyMiddleware, inventory_controller_1.InventoryController.adjustStock);
router.patch('/inventory/:id/increment', auth_1.authenticate, (0, rbac_1.requireRole)('owner', 'manager', 'stock_manager'), inventory_controller_1.InventoryController.incrementStock);
exports.default = router;
//# sourceMappingURL=inventory.routes.js.map