const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Task = require('../src/models/task.model');

const TEST_DB = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/taskmanager_test';

let adminToken, userToken, adminId, userId;

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Task.deleteMany({});

  // First user auto-becomes admin
  const adminRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Admin User', email: 'admin@test.com', password: 'password123' });

  adminToken = adminRes.body.token;
  adminId = adminRes.body.user._id;

  const userRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Regular User', email: 'user@test.com', password: 'password123' });

  userToken = userRes.body.token;
  userId = userRes.body.user._id;
});

// ── Auth ───────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('registers a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'New User', email: 'new@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('user');
  });

  it('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dup', email: 'admin@test.com', password: 'password123' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
  });
});

// ── Tasks ──────────────────────────────────────────────────────────────────

describe('Task CRUD (user-scoped)', () => {
  it('creates a task for authenticated user', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Test task', priority: 'high' });

    expect(res.status).toBe(201);
    expect(res.body.task.title).toBe('Test task');
    expect(res.body.task.owner).toBe(userId);
  });

  it('returns only the user\'s own tasks', async () => {
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Admin task' });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'User task' });

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.tasks.length).toBe(1);
    expect(res.body.tasks[0].title).toBe('User task');
  });

  it('prevents updating another user\'s task', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Admin task' });

    const res = await request(app)
      .patch(`/api/tasks/${create.body.task._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Hijacked' });

    expect(res.status).toBe(404); // user can't see admin's task
  });
});

// ── Admin Middleware ───────────────────────────────────────────────────────

describe('Admin route protection', () => {
  it('blocks regular user from /api/admin/users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('allows admin to access /api/admin/users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/admin/analytics');
    expect(res.status).toBe(401);
  });
});

// ── Admin User Management ──────────────────────────────────────────────────

describe('Admin user management', () => {
  it('toggles user status to inactive', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${userId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'inactive' });

    expect(res.status).toBe(200);
    expect(res.body.user.status).toBe('inactive');
  });

  it('blocks login for inactive user', async () => {
    await request(app)
      .patch(`/api/admin/users/${userId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'inactive' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' });

    expect(res.status).toBe(403);
  });

  it('deletes user and cascades their tasks', async () => {
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'To be deleted' });

    await request(app)
      .delete(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const tasks = await Task.find({ owner: userId });
    expect(tasks.length).toBe(0);
  });
});
