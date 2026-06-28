"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("./dashboard.controller");
const auth_1 = require("../../middlewares/auth");
const rbac_1 = require("../../middlewares/rbac");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/employee', dashboard_controller_1.DashboardController.getEmployeeDashboard);
router.get('/manager', (0, rbac_1.requireRole)('manager', 'owner'), dashboard_controller_1.DashboardController.getManagerDashboard);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map