import request from 'supertest';
import { app } from '../../../server';
import { User } from '../../../models/User';
import { Table } from '../../../models/Table';

let employeeToken: string;
let tableId: string;

beforeAll(async () => {
  const employee = await User.create({
    name: 'Test Employee Table',
    email: 'employee-table@test.com',
    password: 'testpass123',
    role: 'employee',
  });

  const loginRes = await request(app)
    .post('/v1/auth/login')
    .send({ email: 'employee-table@test.com', password: 'testpass123' });
  employeeToken = loginRes.body.data?.accessToken || 'mock-token';
});

afterAll(async () => {
  if (tableId) await Table.deleteMany({ _id: tableId });
  await User.deleteMany({ email: 'employee-table@test.com' });
});

describe('Table Endpoints', () => {
  describe('GET /v1/tables', () => {
    it('should get tables list', async () => {
      const res = await request(app)
        .get('/v1/tables')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /v1/tables/status', () => {
    it('should get table status summary', async () => {
      const res = await request(app)
        .get('/v1/tables/status')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('available');
      expect(res.body.data).toHaveProperty('occupied');
    });
  });

  describe('POST /v1/tables', () => {
    it('should create a table (manager)', async () => {
      const manager = await User.create({
        name: 'Manager Table',
        email: 'manager-table@test.com',
        password: 'testpass123',
        role: 'manager',
      });

      const loginRes = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'manager-table@test.com', password: 'testpass123' });
      const managerToken = loginRes.body.data?.accessToken;

      const res = await request(app)
        .post('/v1/tables')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ number: 100, capacity: 4 });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('_id');
      tableId = res.body.data._id;

      await User.deleteMany({ email: 'manager-table@test.com' });
    });

    it('should deny employee from creating table', async () => {
      const res = await request(app)
        .post('/v1/tables')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ number: 101, capacity: 2 });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /v1/tables/:id/status', () => {
    it('should update table status', async () => {
      const table = await Table.create({ number: 200, capacity: 4, status: 'available' });

      const res = await request(app)
        .patch(`/v1/tables/${table._id}/status`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ status: 'occupied' });

      expect(res.status).toBe(200);

      await Table.deleteOne({ _id: table._id });
    });
  });

  describe('GET /v1/tables/:id', () => {
    it('should get table by id', async () => {
      const table = await Table.create({ number: 201, capacity: 6, status: 'available' });

      const res = await request(app)
        .get(`/v1/tables/${table._id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.number).toBe(201);

      await Table.deleteOne({ _id: table._id });
    });
  });
});
