"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_controller_1 = require("./customer.controller");
const auth_1 = require("../../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/customers/search', auth_1.authenticate, customer_controller_1.CustomerController.searchCustomers);
router.get('/customers/loyalty/ranking', auth_1.authenticate, customer_controller_1.CustomerController.getLoyaltyRanking);
router.get('/customers/:id/loyalty/history', auth_1.authenticate, customer_controller_1.CustomerController.getCustomerLoyaltyHistory);
router.get('/customers/:id/purchase-history', auth_1.authenticate, customer_controller_1.CustomerController.getCustomerPurchaseHistory);
router.get('/customers/:id', auth_1.authenticate, customer_controller_1.CustomerController.getCustomerById);
router.get('/customers', auth_1.authenticate, customer_controller_1.CustomerController.getCustomers);
router.post('/customers', auth_1.authenticate, customer_controller_1.CustomerController.createCustomer);
router.post('/customers/:id/loyalty/redeem', auth_1.authenticate, customer_controller_1.CustomerController.redeemLoyaltyPoints);
router.patch('/customers/:id', auth_1.authenticate, customer_controller_1.CustomerController.updateCustomer);
exports.default = router;
//# sourceMappingURL=customer.routes.js.map