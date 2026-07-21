import request from 'supertest';
import { app } from '../../server';
import { User } from '../../models/User';
import { Settings } from '../../models/Settings';
import { Log } from '../../models/Log';
import { Branch } from '../../models/Branch';

let authToken: string;

beforeAll(async () => {
  const user = await User.create({
    name: 'Test Owner',
    email: 'owner@test.com',
    password: 'hashedpassword123',
    role: 'owner',
  });

  await Settings.create({
    loyalty_points_per_100_mru: 1,
    currency: 'MRU',
    company_name: 'Test Company',
  });

  await Branch.create({
    name: 'Test Branch',
    address: '123 Test Street',
    phone: '+22212345678',
    isActive: true,
  });

  const loginRes = await request(app)
    .post('/v1/auth/login')
    .send({ email: 'owner@test.com', password: 'password123' });
  authToken = loginRes.body.data?.accessToken || 'mock-token';
});

afterAll(async () => {
  await User.deleteMany({});
  await Settings.deleteMany({});
  await Log.deleteMany({});
  await Branch.deleteMany({});
});

describe('Admin Endpoints', () => {
  describe('GET /v1/admin/settings', () => {
    it('should return system settings', async () => {
      const res = await request(app)
        .get('/v1/admin/settings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('loyalty_points_per_100_mru');
      expect(res.body.data).toHaveProperty('currency');
      expect(res.body.data).toHaveProperty('tent_pricing');
    });
  });

  describe('PUT /v1/admin/settings', () => {
    it('should update settings', async () => {
      const res = await request(app)
        .put('/v1/admin/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ company_name: 'Updated Company' });

      expect(res.status).toBe(200);
      expect(res.body.data.company_name).toBe('Updated Company');
    });
  });

  describe('GET /v1/admin/logs', () => {
    it('should return logs', async () => {
      const res = await request(app)
        .get('/v1/admin/logs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body).toHaveProperty('hasMore');
    });
  });

  describe('GET /v1/admin/branches', () => {
    it('should return branches', async () => {
      const res = await request(app)
        .get('/v1/admin/branches')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});
