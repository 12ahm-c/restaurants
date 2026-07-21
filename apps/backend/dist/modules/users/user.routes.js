"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const auth_1 = require("../../middlewares/auth");
const rbac_1 = require("../../middlewares/rbac");
const router = (0, express_1.Router)();
router.get('/me', auth_1.authenticate, user_controller_1.UserController.updateProfile);
router.patch('/me', auth_1.authenticate, user_controller_1.UserController.updateProfile);
router.post('/me/change-password', auth_1.authenticate, user_controller_1.UserController.changePassword);
router.get('/employees', auth_1.authenticate, (0, rbac_1.requireRole)('owner', 'manager'), user_controller_1.UserController.getEmployees);
router.post('/employees', auth_1.authenticate, (0, rbac_1.requireRole)('owner', 'manager'), user_controller_1.UserController.createEmployee);
router.patch('/employees/:id', auth_1.authenticate, (0, rbac_1.requireRole)('owner', 'manager'), user_controller_1.UserController.updateEmployee);
exports.default = router;
//# sourceMappingURL=user.routes.js.map