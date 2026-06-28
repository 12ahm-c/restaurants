import request from 'supertest';
import { app } from '../../../server';
import { User } from '../../../models/User';
import { Table } from '../../../models/Table';
import { Order } from '../../../models/Order';
import { OrderItem } from '../../../models/OrderItem';
import { Product } from '../../../models/Product';
import { Category } from '../../../models/Category';

let authToken: string;
let userId: string;
let tableId: string;
let productId: string;
let categoryId: string;

beforeAll(async () => {
  const user = await User.create({
    name: 'Test Waiter',
    email: 'waiter@test.com',
    password: 'testpass123',
    role: 'employee',
  });
  userId = user._id.toString();

  const table = await Table.create({ number: 99, capacity: 4, status: 'available' });
  tableId = table._id.toString();

  const category = await Category.create({ name: 'Test Category' });
  categoryId = category._id.toString();

  const product = await Product.create({
    name: 'Test Product',
    categoryId: category._id,
    price: 500,
    prepTime: 10,
    status: 'available',
  });
  productId = product._id.toString();

  const loginRes = await request(app)
    .post('/v1/auth/login')
    .send({ email: 'waiter@test.com', password: 'testpass123' });
  authToken = loginRes.body.data?.accessToken || 'mock-token';
});

afterAll(async () => {
  await Order.deleteMany({ userId });
  await OrderItem.deleteMany({ userId });
  await Table.deleteMany({ number: 99 });
  await Product.deleteMany({ _id: productId });
  await Category.deleteMany({ _id: categoryId });
  await User.deleteMany({ email: 'waiter@test.com' });
});

describe('Order Endpoints', () => {
  describe('POST /v1/orders', () => {
    it('should create a new order', async () => {
      const res = await request(app)
        .post('/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .set('idempotency-key', `test-order-${Date.now()}`)
        .send({
          tableId,
          type: 'dine-in',
          items: [{ productId, quantity: 2 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('orderId');
      expect(res.body.data).toHaveProperty('orderNumber');
    });

    it('should fail without tableId', async () => {
      const res = await request(app)
        .post('/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .set('idempotency-key', `test-order-notable-${Date.now()}`)
        .send({
          type: 'dine-in',
          items: [{ productId, quantity: 1 }],
        });

      expect(res.status).toBe(400);
    });

    it('should fail with empty items', async () => {
      const res = await request(app)
        .post('/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .set('idempotency-key', `test-order-empty-${Date.now()}`)
        .send({
          tableId,
          type: 'dine-in',
          items: [],
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /v1/orders/active', () => {
    it('should return active orders', async () => {
      const res = await request(app)
        .get('/v1/orders/active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /v1/orders', () => {
    it('should return orders list', async () => {
      const res = await request(app)
        .get('/v1/orders')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PATCH /v1/orders/:id/status', () => {
    it('should update order status', async () => {
      const order = await Order.create({
        tableId,
        userId,
        type: 'dine-in',
        status: 'new',
        totalHT: 500,
        totalTTC: 590,
      });

      const res = await request(app)
        .patch(`/v1/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'preparing' });

      expect(res.status).toBe(200);

      await Order.deleteOne({ _id: order._id });
    });
  });
});
