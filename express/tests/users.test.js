const request = require('supertest');
const express = require('express');

jest.mock('../models', () => ({
  User: { findByPk: jest.fn() }
}));

const { User } = require('../models');
const usersRouter = require('../routes/users');

const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);

describe('GET /api/users/:id', () => {
  beforeEach(() => {
    User.findByPk.mockReset();
  });

  test('returns 404 when user not found', async () => {
    User.findByPk.mockResolvedValue(null);
    const res = await request(app).get('/api/users/1');
    expect(res.status).toBe(404);
  });

  test('returns user data when found', async () => {
    User.findByPk.mockResolvedValue({ id: 1, realName: 'John', email: 'john@example.com', phone: '123' });
    const res = await request(app).get('/api/users/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  test('handles db error', async () => {
    User.findByPk.mockRejectedValue(new Error('DB error'));
    const res = await request(app).get('/api/users/1');
    expect(res.status).toBe(500);
  });
});
