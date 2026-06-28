import request from 'supertest';
import { app } from '../../../server';
import { User } from '../../../models/User';
import { Log } from '../../../models/Log';

beforeAll(async () => {
  await User.deleteMany({ email: 'auth-test@test.com' });
});

afterAll(async () => {
  await User.deleteMany({ email: 'auth-test@test.com' });
  await Log.deleteMany({ entity: 'User' });
});

describe('Auth Endpoints', () => {
  describe('POST /v1/auth/login', () => {
    it('should fail with invalid credentials', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_REQUIRED');
    });

    it('should login successfully with valid credentials', async () => {
      await User.create({
        name: 'Auth Test User',
        email: 'auth-test@test.com',
        password: 'testpass123',
        role: 'employee',
      });

      const res = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'auth-test@test.com', password: 'testpass123' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe('auth-test@test.com');
    });
  });

  describe('GET /v1/auth/me', () => {
    it('should return current user profile', async () => {
      const loginRes = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'auth-test@test.com', password: 'testpass123' });

      const token = loginRes.body.data.accessToken;

      const res = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('auth-test@test.com');
    });

    it('should fail without token', async () => {
      const res = await request(app)
        .get('/v1/auth/me');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const loginRes = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'auth-test@test.com', password: 'testpass123' });

      const refreshToken = loginRes.body.data.refreshToken;

      const res = await request(app)
        .post('/v1/auth/logout')
        .send({ refreshToken });

      expect(res.status).toBe(200);
    });
  });
});
