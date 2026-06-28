"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supplier_controller_1 = require("./supplier.controller");
const auth_1 = require("../../middlewares/auth");
const rbac_1 = require("../../middlewares/rbac");
const router = (0, express_1.Router)();
router.get('/suppliers', auth_1.authenticate, supplier_controller_1.SupplierController.getSuppliers);
router.get('/suppliers/:id/movements', auth_1.authenticate, supplier_controller_1.SupplierController.getSupplierMovements);
router.post('/suppliers', auth_1.authenticate, (0, rbac_1.requireRole)('owner', 'manager', 'stock_manager'), supplier_controller_1.SupplierController.createSupplier);
exports.default = router;
//# sourceMappingURL=supplier.routes.js.map