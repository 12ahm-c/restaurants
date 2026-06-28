"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("./settings.controller");
const admin_controller_1 = require("./admin.controller");
const auth_1 = require("../../middlewares/auth");
const rbac_1 = require("../../middlewares/rbac");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/settings', (0, rbac_1.requireRole)('owner'), settings_controller_1.SettingsController.getSettings);
router.put('/settings', (0, rbac_1.requireRole)('owner'), settings_controller_1.SettingsController.updateSettings);
router.get('/logs', (0, rbac_1.requireRole)('owner'), admin_controller_1.AdminController.getLogs);
router.get('/branches', (0, rbac_1.requireRole)('owner'), admin_controller_1.AdminController.getBranches);
router.post('/branches', (0, rbac_1.requireRole)('owner'), admin_controller_1.AdminController.createBranch);
router.put('/branches/:id', (0, rbac_1.requireRole)('owner'), admin_controller_1.AdminController.updateBranch);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map