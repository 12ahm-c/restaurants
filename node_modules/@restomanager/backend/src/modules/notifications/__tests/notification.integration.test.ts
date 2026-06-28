import request from 'supertest';
import { app } from '../../server';
import { User } from '../../models/User';
import { Notification } from '../../models/Notification';

let authToken: string;
let userId: string;

beforeAll(async () => {
  const user = await User.create({
    name: 'Test User',
    email: 'test@test.com',
    password: 'hashedpassword123',
    role: 'manager',
  });
  userId = user._id.toString();

  await Notification.create({
    userId: user._id,
    title: 'Test Notification',
    message: 'This is a test notification',
    type: 'system',
    isRead: false,
  });

  await Notification.create({
    userId: user._id,
    title: 'Read Notification',
    message: 'This is a read notification',
    type: 'order_ready',
    isRead: true,
  });

  const loginRes = await request(app)
    .post('/v1/auth/login')
    .send({ email: 'test@test.com', password: 'password123' });
  authToken = loginRes.body.data?.accessToken || 'mock-token';
});

afterAll(async () => {
  await User.deleteMany({});
  await Notification.deleteMany({});
});

describe('Notification Endpoints', () => {
  describe('GET /v1/notifications/me', () => {
    it('should return user notifications', async () => {
      const res = await request(app)
        .get('/v1/notifications/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('unreadCount');
    });

    it('should filter unread only', async () => {
      const res = await request(app)
        .get('/v1/notifications/me')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ unreadOnly: 'true' });

      expect(res.status).toBe(200);
      const unreadNotifications = res.body.data.filter((n: any) => !n.isRead);
      expect(unreadNotifications.length).toBe(res.body.data.length);
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/v1/notifications/me')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 1 });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('PATCH /v1/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const notification = await Notification.findOne({ userId, isRead: false });
      if (!notification) return;

      const res = await request(app)
        .patch(`/v1/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isRead).toBe(true);
    });

    it('should return 404 for non-existent notification', async () => {
      const res = await request(app)
        .patch('/v1/notifications/000000000000000000000000/read')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /v1/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const res = await request(app)
        .patch('/v1/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('updatedCount');

      const checkRes = await request(app)
        .get('/v1/notifications/me')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ unreadOnly: 'true' });

      expect(checkRes.body.data.length).toBe(0);
    });
  });
});
