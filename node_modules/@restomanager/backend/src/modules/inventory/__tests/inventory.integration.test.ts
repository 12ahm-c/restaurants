import request from 'supertest';
import { app } from '../../../server';
import { User } from '../../../models/User';
import { Inventory } from '../../../models/Inventory';
import { StockMovement } from '../../../models/StockMovement';

let managerToken: string;
let inventoryId: string;

beforeAll(async () => {
  const manager = await User.create({
    name: 'Test Manager Inv',
    email: 'manager-inv@test.com',
    password: 'testpass123',
    role: 'manager',
  });

  const loginRes = await request(app)
    .post('/v1/auth/login')
    .send({ email: 'manager-inv@test.com', password: 'testpass123' });
  managerToken = loginRes.body.data?.accessToken || 'mock-token';
});

afterAll(async () => {
  if (inventoryId) await Inventory.deleteMany({ _id: inventoryId });
  await User.deleteMany({ email: 'manager-inv@test.com' });
});

describe('Inventory Endpoints', () => {
  describe('POST /v1/inventory', () => {
    it('should create inventory item', async () => {
      const res = await request(app)
        .post('/v1/inventory')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Test Flour',
          category: 'Ingredients',
          unit: 'kg',
          quantity: 50,
          threshold: 10,
          unitPrice: 200,
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('_id');
      inventoryId = res.body.data._id;
    });
  });

  describe('GET /v1/inventory', () => {
    it('should get inventory list', async () => {
      const res = await request(app)
        .get('/v1/inventory')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /v1/inventory/:id', () => {
    it('should get inventory by id', async () => {
      const res = await request(app)
        .get(`/v1/inventory/${inventoryId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Test Flour');
    });
  });

  describe('PATCH /v1/inventory/:id/adjust', () => {
    it('should adjust stock', async () => {
      const res = await request(app)
        .patch(`/v1/inventory/${inventoryId}/adjust`)
        .set('Authorization', `Bearer ${managerToken}`)
        .set('idempotency-key', `test-adjust-${Date.now()}`)
        .send({ quantity: 45, reason: 'Stock count' });

      expect(res.status).toBe(200);
    });
  });

  describe('PATCH /v1/inventory/:id/increment', () => {
    it('should increment stock', async () => {
      const res = await request(app)
        .patch(`/v1/inventory/${inventoryId}/increment`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ quantity: 10, type: 'replenishment', unitPrice: 200 });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /v1/inventory/alerts', () => {
    it('should get stock alerts', async () => {
      const res = await request(app)
        .get('/v1/inventory/alerts')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /v1/inventory/stock-value', () => {
    it('should get stock value', async () => {
      const res = await request(app)
        .get('/v1/inventory/stock-value')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalValue');
    });
  });

  describe('GET /v1/inventory/:id/movements', () => {
    it('should get stock movements', async () => {
      const res = await request(app)
        .get(`/v1/inventory/${inventoryId}/movements`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
