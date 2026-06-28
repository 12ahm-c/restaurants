import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../server';
import { User } from '../../models/User';
import { Order } from '../../models/Order';
import { Table } from '../../models/Table';
import { Payment } from '../../models/Payment';
import { CashDrawer } from '../../models/CashDrawer';
import { Customer } from '../../models/Customer';
import { LoyaltyTransaction } from '../../models/LoyaltyTransaction';

let authToken: string;
let userId: string;
let orderId: string;
let tableId: string;
let customerId: string;

beforeAll(async () => {
  const user = await User.create({
    name: 'Test Cashier',
    email: 'cashier@test.com',
    password: 'hashedpassword123',
    role: 'cashier',
  });
  userId = user._id.toString();

  const table = await Table.create({ number: 1, capacity: 4, status: 'available' });
  tableId = table._id.toString();

  const customer = await Customer.create({
    firstName: 'Test',
    lastName: 'Customer',
    phone: '+22212345678',
    loyaltyPoints: 0,
  });
  customerId = customer._id.toString();

  const order = await Order.create({
    tableId: table._id,
    userId: user._id,
    type: 'dine-in',
    status: 'new',
    totalHT: 1000,
    totalTTC: 1180,
    paid: false,
  });
  orderId = order._id.toString();

  const loginRes = await request(app)
    .post('/v1/auth/login')
    .send({ email: 'cashier@test.com', password: 'password123' });
  authToken = loginRes.body.data?.accessToken || 'mock-token';
});

afterAll(async () => {
  await User.deleteMany({});
  await Order.deleteMany({});
  await Table.deleteMany({});
  await Payment.deleteMany({});
  await CashDrawer.deleteMany({});
  await Customer.deleteMany({});
  await LoyaltyTransaction.deleteMany({});
});

describe('Payment Endpoints', () => {
  describe('POST /v1/payments', () => {
    it('should process cash payment', async () => {
      const res = await request(app)
        .post('/v1/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .set('idempotency-key', `test-${Date.now()}`)
        .send({
          orderId,
          amount: 1180,
          method: 'cash',
          cashGiven: 1200,
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('paymentId');
      expect(res.body.data.changeAmount).toBe(20);
      expect(res.body.data.loyaltyPointsEarned).toBe(11);
    });

    it('should fail with amount mismatch', async () => {
      const res = await request(app)
        .post('/v1/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .set('idempotency-key', `test-mismatch-${Date.now()}`)
        .send({
          orderId,
          amount: 500,
          method: 'cash',
          cashGiven: 600,
        });

      expect(res.status).toBe(400);
    });

    it('should fail with cash given less than amount', async () => {
      const newOrder = await Order.create({
        tableId: tableId,
        userId: userId,
        type: 'dine-in',
        status: 'new',
        totalHT: 1000,
        totalTTC: 1180,
        paid: false,
      });

      const res = await request(app)
        .post('/v1/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .set('idempotency-key', `test-${Date.now()}`)
        .send({
          orderId: newOrder._id.toString(),
          amount: 1180,
          method: 'cash',
          cashGiven: 1000,
        });

      expect(res.status).toBe(400);
    });

    it('should process card payment', async () => {
      const newOrder = await Order.create({
        tableId: tableId,
        userId: userId,
        type: 'dine-in',
        status: 'new',
        totalHT: 1000,
        totalTTC: 1180,
        paid: false,
      });

      const res = await request(app)
        .post('/v1/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .set('idempotency-key', `test-card-${Date.now()}`)
        .send({
          orderId: newOrder._id.toString(),
          amount: 1180,
          method: 'card',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.changeAmount).toBe(0);
    });

    it('should process mobile payment', async () => {
      const newOrder = await Order.create({
        tableId: tableId,
        userId: userId,
        type: 'dine-in',
        status: 'new',
        totalHT: 1000,
        totalTTC: 1180,
        paid: false,
      });

      const res = await request(app)
        .post('/v1/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .set('idempotency-key', `test-mobile-${Date.now()}`)
        .send({
          orderId: newOrder._id.toString(),
          amount: 1180,
          method: 'mobile',
        });

      expect(res.status).toBe(201);
    });

    it('should prevent duplicate payment with idempotency key', async () => {
      const newOrder = await Order.create({
        tableId: tableId,
        userId: userId,
        type: 'dine-in',
        status: 'new',
        totalHT: 1000,
        totalTTC: 1180,
        paid: false,
      });

      const idempotencyKey = `test-idempotent-${Date.now()}`;

      const res1 = await request(app)
        .post('/v1/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .set('idempotency-key', idempotencyKey)
        .send({
          orderId: newOrder._id.toString(),
          amount: 1180,
          method: 'cash',
          cashGiven: 1200,
        });

      const res2 = await request(app)
        .post('/v1/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .set('idempotency-key', idempotencyKey)
        .send({
          orderId: newOrder._id.toString(),
          amount: 1180,
          method: 'cash',
          cashGiven: 1200,
        });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res1.body.data.paymentId).toBe(res2.body.data.paymentId);
    });
  });

  describe('Cash Drawer Endpoints', () => {
    it('should open cash drawer', async () => {
      const res = await request(app)
        .post('/v1/payments/cash-drawer/open')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          branchId: 'default',
          openingBalance: 5000,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('open');
      expect(res.body.data.openingBalance).toBe(5000);
    });

    it('should get current cash drawer', async () => {
      const res = await request(app)
        .get('/v1/payments/cash-drawer')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ branchId: 'default' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('open');
    });

    it('should fail to open second drawer', async () => {
      const res = await request(app)
        .post('/v1/payments/cash-drawer/open')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          branchId: 'default',
          openingBalance: 1000,
        });

      expect(res.status).toBe(400);
    });

    it('should close cash drawer with difference', async () => {
      const drawerRes = await request(app)
        .get('/v1/payments/cash-drawer')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ branchId: 'default' });

      const drawerId = drawerRes.body.data._id;

      const res = await request(app)
        .post('/v1/payments/cash-drawer/close')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          drawerId,
          declaredBalance: 5100,
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('expectedBalance');
      expect(res.body.data).toHaveProperty('difference');
    });
  });

  describe('Loyalty Points Integration', () => {
    it('should earn loyalty points on payment', async () => {
      const newOrder = await Order.create({
        tableId: tableId,
        userId: userId,
        customerId: customerId,
        type: 'dine-in',
        status: 'new',
        totalHT: 1000,
        totalTTC: 1180,
        paid: false,
      });

      await request(app)
        .post('/v1/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .set('idempotency-key', `test-loyalty-${Date.now()}`)
        .send({
          orderId: newOrder._id.toString(),
          amount: 1180,
          method: 'cash',
          cashGiven: 1200,
        });

      const customer = await Customer.findById(customerId);
      expect(customer?.loyaltyPoints).toBeGreaterThan(0);

      const transactions = await LoyaltyTransaction.find({ customerId });
      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions[0].type).toBe('earn');
    });
  });
});
