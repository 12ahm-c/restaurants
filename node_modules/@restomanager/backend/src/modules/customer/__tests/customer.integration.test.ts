import request from 'supertest';
import { app } from '../../../server';
import { User } from '../../../models/User';
import { Customer } from '../../../models/Customer';

let employeeToken: string;
let customerId: string;

beforeAll(async () => {
  const employee = await User.create({
    name: 'Test Employee Cust',
    email: 'employee-cust@test.com',
    password: 'testpass123',
    role: 'employee',
  });

  const loginRes = await request(app)
    .post('/v1/auth/login')
    .send({ email: 'employee-cust@test.com', password: 'testpass123' });
  employeeToken = loginRes.body.data?.accessToken || 'mock-token';
});

afterAll(async () => {
  if (customerId) await Customer.deleteMany({ _id: customerId });
  await User.deleteMany({ email: 'employee-cust@test.com' });
});

describe('Customer Endpoints', () => {
  describe('POST /v1/customers', () => {
    it('should create a customer', async () => {
      const res = await request(app)
        .post('/v1/customers')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          firstName: 'Test',
          lastName: 'Customer',
          phone: '+22212345678',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('_id');
      customerId = res.body.data._id;
    });

    it('should fail with duplicate phone', async () => {
      const res = await request(app)
        .post('/v1/customers')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          firstName: 'Duplicate',
          lastName: 'Phone',
          phone: '+22212345678',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /v1/customers', () => {
    it('should get customers list', async () => {
      const res = await request(app)
        .get('/v1/customers')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /v1/customers/search', () => {
    it('should search customers', async () => {
      const res = await request(app)
        .get('/v1/customers/search')
        .set('Authorization', `Bearer ${employeeToken}`)
        .query({ q: 'Test' });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /v1/customers/:id', () => {
    it('should get customer by id', async () => {
      const res = await request(app)
        .get(`/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.firstName).toBe('Test');
    });
  });

  describe('PATCH /v1/customers/:id', () => {
    it('should update customer', async () => {
      const res = await request(app)
        .patch(`/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /v1/customers/loyalty/ranking', () => {
    it('should get loyalty ranking', async () => {
      const res = await request(app)
        .get('/v1/customers/loyalty/ranking')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
