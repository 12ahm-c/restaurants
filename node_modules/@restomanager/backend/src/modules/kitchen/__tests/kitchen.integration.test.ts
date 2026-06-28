import request from 'supertest';
import { app } from '../../../server';
import { User } from '../../../models/User';
import { Table } from '../../../models/Table';
import { Order } from '../../../models/Order';
import { KitchenQueue } from '../../../models/KitchenQueue';

let chefToken: string;
let orderId: string;
let queueId: string;

beforeAll(async () => {
  const chef = await User.create({
    name: 'Test Chef',
    email: 'chef@test.com',
    password: 'testpass123',
    role: 'chef',
  });

  const table = await Table.create({ number: 50, capacity: 4, status: 'occupied' });

  const order = await Order.create({
    tableId: table._id,
    userId: chef._id,
    type: 'dine-in',
    status: 'new',
    totalHT: 1000,
    totalTTC: 1180,
  });
  orderId = order._id.toString();

  const queue = await KitchenQueue.create({
    orderId: order._id,
    priority: 0,
    status: 'pending',
  });
  queueId = queue._id.toString();

  const loginRes = await request(app)
    .post('/v1/auth/login')
    .send({ email: 'chef@test.com', password: 'testpass123' });
  chefToken = loginRes.body.data?.accessToken || 'mock-token';
});

afterAll(async () => {
  if (queueId) await KitchenQueue.deleteMany({ _id: queueId });
  if (orderId) await Order.deleteMany({ _id: orderId });
  await Table.deleteMany({ number: 50 });
  await User.deleteMany({ email: 'chef@test.com' });
});

describe('Kitchen Endpoints', () => {
  describe('GET /v1/kitchen/queue', () => {
    it('should get kitchen queue', async () => {
      const res = await request(app)
        .get('/v1/kitchen/queue')
        .set('Authorization', `Bearer ${chefToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /v1/kitchen/queue/priority', () => {
    it('should get priority queue', async () => {
      const res = await request(app)
        .get('/v1/kitchen/queue/priority')
        .set('Authorization', `Bearer ${chefToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PATCH /v1/kitchen/queue/:id/start', () => {
    it('should start preparation', async () => {
      const res = await request(app)
        .patch(`/v1/kitchen/queue/${queueId}/start`)
        .set('Authorization', `Bearer ${chefToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('PATCH /v1/kitchen/queue/:id/ready', () => {
    it('should mark as ready', async () => {
      const res = await request(app)
        .patch(`/v1/kitchen/queue/${queueId}/ready`)
        .set('Authorization', `Bearer ${chefToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Access Control', () => {
    it('should deny employee from accessing kitchen queue', async () => {
      const employee = await User.create({
        name: 'Employee Kitchen',
        email: 'employee-kitchen@test.com',
        password: 'testpass123',
        role: 'employee',
      });

      const loginRes = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'employee-kitchen@test.com', password: 'testpass123' });
      const employeeToken = loginRes.body.data?.accessToken;

      const res = await request(app)
        .get('/v1/kitchen/queue')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);

      await User.deleteMany({ email: 'employee-kitchen@test.com' });
    });
  });
});
