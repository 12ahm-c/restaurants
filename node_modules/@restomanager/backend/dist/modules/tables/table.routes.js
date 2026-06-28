"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const table_controller_1 = require("./table.controller");
const auth_1 = require("../../middlewares/auth");
const rbac_1 = require("../../middlewares/rbac");
const router = (0, express_1.Router)();
router.get('/tables/status', auth_1.authenticate, table_controller_1.TableController.getTableStatusSummary);
router.get('/tables', auth_1.authenticate, table_controller_1.TableController.getTables);
router.get('/tables/:id', auth_1.authenticate, table_controller_1.TableController.getTableById);
router.patch('/tables/:id/status', auth_1.authenticate, table_controller_1.TableController.updateTableStatus);
router.post('/tables', auth_1.authenticate, (0, rbac_1.requireRole)('owner', 'manager'), table_controller_1.TableController.createTable);
exports.default = router;
//# sourceMappingURL=table.routes.js.map