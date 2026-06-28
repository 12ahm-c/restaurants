import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../server';
import { User } from '../../models/User';
import { Order } from '../../models/Order';
import { Table } from '../../models/Table';
import { Payment } from '../../models/Payment';
import { Inventory } from '../../models/Inventory';
import { StockMovement } from '../../models/StockMovement';

let authToken: string;

beforeAll(async () => {
  const user = await User.create({
    name: 'Test Manager',
    email: 'manager@test.com',
    password: 'hashedpassword123',
    role: 'manager',
  });

  const table = await Table.create({ number: 1, capacity: 4, status: 'occupied' });

  const order = await Order.create({
    tableId: table._id,
    userId: user._id,
    type: 'dine-in',
    status: 'paid',
    totalHT: 1000,
    totalTTC: 1180,
    paid: true,
  });

  await Payment.create({
    orderId: order._id,
    amount: 1180,
    method: 'cash',
    status: 'completed',
    userId: user._id,
    changeAmount: 0,
  });

  const inventory = await Inventory.create({
    name: 'Test Ingredient',
    unit: 'kg',
    quantity: 10,
    threshold: 5,
    unitPrice: 100,
  });

  await StockMovement.create({
    inventoryId: inventory._id,
    type: 'replenishment',
    quantity: 5,
    userId: user._id,
  });

  const loginRes = await request(app)
    .post('/v1/auth/login')
    .send({ email: 'manager@test.com', password: 'password123' });
  authToken = loginRes.body.data?.accessToken || 'mock-token';
});

afterAll(async () => {
  await User.deleteMany({});
  await Order.deleteMany({});
  await Table.deleteMany({});
  await Payment.deleteMany({});
  await Inventory.deleteMany({});
  await StockMovement.deleteMany({});
});

describe('Dashboard Endpoints', () => {
  describe('GET /v1/dashboard/employee', () => {
    it('should return employee KPIs', async () => {
      const res = await request(app)
        .get('/v1/dashboard/employee')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('todayOrdersCount');
      expect(res.body.data).toHaveProperty('todayRevenue');
      expect(res.body.data).toHaveProperty('todayAverageTicket');
      expect(res.body.data).toHaveProperty('activeTables');
      expect(res.body.data).toHaveProperty('pendingKitchenOrders');
    });
  });

  describe('GET /v1/dashboard/manager', () => {
    it('should return manager KPIs', async () => {
      const res = await request(app)
        .get('/v1/dashboard/manager')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ period: 'day' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('revenue');
      expect(res.body.data).toHaveProperty('orders');
      expect(res.body.data).toHaveProperty('topProducts');
      expect(res.body.data).toHaveProperty('tableUtilization');
      expect(res.body.data).toHaveProperty('alertsCount');
    });

    it('should return KPIs for week period', async () => {
      const res = await request(app)
        .get('/v1/dashboard/manager')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ period: 'week' });

      expect(res.status).toBe(200);
      expect(res.body.data.revenue).toHaveProperty('total');
      expect(res.body.data.revenue).toHaveProperty('change');
    });
  });
});

describe('Reports Endpoints', () => {
  describe('GET /v1/reports/sales', () => {
    it('should return sales report', async () => {
      const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const to = new Date().toISOString().split('T')[0];

      const res = await request(app)
        .get('/v1/reports/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ from, to });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('period');
      expect(res.body.data).toHaveProperty('sales');
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data.summary).toHaveProperty('totalSales');
      expect(res.body.data.summary).toHaveProperty('totalOrders');
      expect(res.body.data.summary).toHaveProperty('averageTicket');
    });

    it('should return PDF when format=pdf', async () => {
      const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const to = new Date().toISOString().split('T')[0];

      const res = await request(app)
        .get('/v1/reports/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ from, to, format: 'pdf' });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    it('should return Excel when format=xlsx', async () => {
      const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const to = new Date().toISOString().split('T')[0];

      const res = await request(app)
        .get('/v1/reports/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ from, to, format: 'xlsx' });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheetml');
    });
  });

  describe('GET /v1/reports/profitability', () => {
    it('should return profitability report', async () => {
      const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const to = new Date().toISOString().split('T')[0];

      const res = await request(app)
        .get('/v1/reports/profitability')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ from, to });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('revenue');
      expect(res.body.data).toHaveProperty('expenses');
      expect(res.body.data).toHaveProperty('profit');
      expect(res.body.data).toHaveProperty('margin');
    });
  });

  describe('GET /v1/reports/stock-usage', () => {
    it('should return stock usage report', async () => {
      const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const to = new Date().toISOString().split('T')[0];

      const res = await request(app)
        .get('/v1/reports/stock-usage')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ from, to });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('period');
      expect(res.body.data).toHaveProperty('items');
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  describe('Caching', () => {
    it('should cache dashboard results', async () => {
      const res1 = await request(app)
        .get('/v1/dashboard/employee')
        .set('Authorization', `Bearer ${authToken}`);

      const res2 = await request(app)
        .get('/v1/dashboard/employee')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
    });
  });
});
