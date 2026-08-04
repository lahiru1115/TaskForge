import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import supertest from 'supertest';
import app from '../src/app';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

const request = supertest(app);

describe('auth smoke: register -> login -> me', () => {
  const email = 'smoke-auth@taskforge.test';
  const password = 'password123';

  it('registers and returns the created user with an auth cookie', async () => {
    const res = await request
      .post('/api/auth/register')
      .send({ name: 'Smoke Test', email, password });

    expect(res.status).toBe(201);
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.body.user.email).toBe(email);
  });

  it('logs in and reaches /me with the cookie', async () => {
    const loginRes = await request.post('/api/auth/login').send({ email, password });
    expect(loginRes.status).toBe(200);

    const cookie = loginRes.headers['set-cookie'];
    const meRes = await request.get('/api/auth/me').set('Cookie', cookie);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(email);
  });
});

describe('task smoke: create -> list', () => {
  const email = 'smoke-task@taskforge.test';
  const password = 'password123';
  let cookie: string;

  beforeAll(async () => {
    const res = await request
      .post('/api/auth/register')
      .send({ name: 'Task Smoke', email, password });
    cookie = res.headers['set-cookie'];
  });

  it('creates a task', async () => {
    const res = await request
      .post('/api/tasks')
      .set('Cookie', cookie)
      .send({ title: 'Smoke test task' });

    expect(res.status).toBe(201);
    expect(res.body.task.title).toBe('Smoke test task');
  });

  it('lists the created task', async () => {
    const res = await request.get('/api/tasks').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.tasks.some((t: { title: string }) => t.title === 'Smoke test task')).toBe(true);
  });
});

describe('unauthenticated access', () => {
  it('returns 401 for a protected route with no cookie', async () => {
    const res = await request.get('/api/tasks');
    expect(res.status).toBe(401);
  });
});
