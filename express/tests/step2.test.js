const request = require('supertest');
const express = require('express');

jest.mock('../models', () => ({
  File: {
    findByPk: jest.fn()
  },
  Scan: {
    create: jest.fn()
  },
  User: {}
}));

const { File, Scan } = require('../models');
const protectRouter = require('../routes/protect');

const app = express();
app.use(express.json());
app.use('/api/protect', protectRouter);

describe('POST /api/protect/step2', () => {
  beforeEach(() => {
    File.findByPk.mockReset();
    if (Scan.create) Scan.create.mockReset();
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

  test('valid fileId dispatches task', async () => {
    File.findByPk.mockResolvedValue({ id: 2, save: jest.fn() });
    Scan.create = jest.fn().mockResolvedValue({ id: 5 });
    const res = await request(app).post('/api/protect/step2').send({ fileId: 2 });
    expect(res.status).toBe(202);
    expect(res.body.taskId).toBe(5);
  });
});
