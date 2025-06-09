const request = require('supertest');
const express = require('express');

jest.mock('../models', () => ({
  File: {
    findByPk: jest.fn()
  },
  User: {}
}));

const { File } = require('../models');
const protectRouter = require('../routes/protect');

const app = express();
app.use(express.json());
app.use('/api/protect', protectRouter);

describe('POST /api/protect/step2', () => {
  beforeEach(() => {
    File.findByPk.mockReset();
  });

  test('missing fileId returns 400', async () => {
    const res = await request(app).post('/api/protect/step2').send({});
    expect(res.status).toBe(400);
  });

  test('non existent file returns 404', async () => {
    File.findByPk.mockResolvedValue(null);
    const res = await request(app).post('/api/protect/step2').send({ fileId: 1 });
    expect(res.status).toBe(404);
  });

  test('valid fileId returns success', async () => {
    File.findByPk.mockResolvedValue({ id: 2, save: jest.fn() });
    const res = await request(app).post('/api/protect/step2').send({ fileId: 2 });
    expect(res.status).toBe(200);
    expect(res.body.fileId).toBe(2);
  });
});
