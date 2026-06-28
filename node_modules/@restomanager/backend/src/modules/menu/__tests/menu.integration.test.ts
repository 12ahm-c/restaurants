import request from 'supertest';
import { app } from '../../../server';
import { User } from '../../../models/User';
import { Category } from '../../../models/Category';
import { Product } from '../../../models/Product';

let managerToken: string;
let categoryId: string;
let productId: string;

beforeAll(async () => {
  const manager = await User.create({
    name: 'Test Manager Menu',
    email: 'manager-menu@test.com',
    password: 'testpass123',
    role: 'manager',
  });

  const loginRes = await request(app)
    .post('/v1/auth/login')
    .send({ email: 'manager-menu@test.com', password: 'testpass123' });
  managerToken = loginRes.body.data?.accessToken || 'mock-token';
});

afterAll(async () => {
  if (productId) await Product.deleteMany({ _id: productId });
  if (categoryId) await Category.deleteMany({ _id: categoryId });
  await User.deleteMany({ email: 'manager-menu@test.com' });
});

describe('Menu Endpoints', () => {
  describe('Category CRUD', () => {
    it('should create a category', async () => {
      const res = await request(app)
        .post('/v1/menu/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Test Menu Category' });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('_id');
      categoryId = res.body.data._id;
    });

    it('should get categories', async () => {
      const res = await request(app)
        .get('/v1/menu/categories')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should update a category', async () => {
      const res = await request(app)
        .put(`/v1/menu/categories/${categoryId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Updated Category' });

      expect(res.status).toBe(200);
    });
  });

  describe('Product CRUD', () => {
    it('should create a product', async () => {
      const res = await request(app)
        .post('/v1/menu/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Test Menu Product',
          categoryId,
          price: 750,
          prepTime: 15,
          status: 'available',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('_id');
      productId = res.body.data._id;
    });

    it('should get products', async () => {
      const res = await request(app)
        .get('/v1/menu/products')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should get product by id', async () => {
      const res = await request(app)
        .get(`/v1/menu/products/${productId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Test Menu Product');
    });

    it('should update product status', async () => {
      const res = await request(app)
        .patch(`/v1/menu/products/${productId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'unavailable' });

      expect(res.status).toBe(200);
    });

    it('should update a product', async () => {
      const res = await request(app)
        .put(`/v1/menu/products/${productId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Updated Product', price: 850 });

      expect(res.status).toBe(200);
    });

    it('should delete a product', async () => {
      const res = await request(app)
        .delete(`/v1/menu/products/${productId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      productId = '';
    });
  });

  describe('Access Control', () => {
    it('should deny employee from creating category', async () => {
      const employee = await User.create({
        name: 'Employee',
        email: 'employee-menu@test.com',
        password: 'testpass123',
        role: 'employee',
      });

      const loginRes = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'employee-menu@test.com', password: 'testpass123' });
      const employeeToken = loginRes.body.data?.accessToken;

      const res = await request(app)
        .post('/v1/menu/categories')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Unauthorized Category' });

      expect(res.status).toBe(403);

      await User.deleteMany({ email: 'employee-menu@test.com' });
    });
  });
});
