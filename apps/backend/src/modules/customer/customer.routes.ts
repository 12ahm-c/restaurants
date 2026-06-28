import { Router } from 'express';
import { CustomerController } from './customer.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole, Role } from '../../middlewares/rbac';

const router = Router();

router.get('/customers/search', authenticate, CustomerController.searchCustomers);
router.get('/customers/loyalty/ranking', authenticate, CustomerController.getLoyaltyRanking);
router.get('/customers/:id/loyalty/history', authenticate, CustomerController.getCustomerLoyaltyHistory);
router.get('/customers/:id/purchase-history', authenticate, CustomerController.getCustomerPurchaseHistory);
router.get('/customers/:id', authenticate, CustomerController.getCustomerById);
router.get('/customers', authenticate, CustomerController.getCustomers);

router.post('/customers', authenticate, CustomerController.createCustomer);
router.post('/customers/:id/loyalty/redeem', authenticate, CustomerController.redeemLoyaltyPoints);

router.patch('/customers/:id', authenticate, CustomerController.updateCustomer);

export default router;
