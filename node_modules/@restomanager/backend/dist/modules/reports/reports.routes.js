"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reports_controller_1 = require("./reports.controller");
const auth_1 = require("../../middlewares/auth");
const rbac_1 = require("../../middlewares/rbac");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/sales', (0, rbac_1.requireRole)('manager', 'owner'), reports_controller_1.ReportsController.getSalesReport);
router.get('/profitability', (0, rbac_1.requireRole)('owner'), reports_controller_1.ReportsController.getProfitabilityReport);
router.get('/stock-usage', (0, rbac_1.requireRole)('stock_manager', 'manager', 'owner'), reports_controller_1.ReportsController.getStockUsageReport);
exports.default = router;
//# sourceMappingURL=reports.routes.js.map