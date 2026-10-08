import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { TITLE_MAX } from '@todo/shared';
import { createApp } from '../app';
import { Todo } from '../models/Todo';

const app = createApp({ clientOrigin: 'http://localhost:5173' });
const missingId = '64b7f9f0c2a4e1a2b3c4d5e6';
let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Todo.deleteMany({});
});

const create = (title: string, description?: string) =>
  request(app).post('/api/todos').send({ title, description });

describe('POST /api/todos', () => {
  it('creates a todo with trimmed fields and defaults', async () => {
    const res = await create('  Buy milk  ');
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'Buy milk', description: '', done: false });
    expect(res.body.id).toEqual(expect.any(String));
    expect(res.body).not.toHaveProperty('_id');
    expect(res.body).not.toHaveProperty('__v');
  });

  it('rejects a blank title with field details', async () => {
    const res = await create('   ');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual([{ path: 'title', message: 'Title is required' }]);
  });

  it('rejects a title with only special characters', async () => {
    const res = await create('!!!');
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Title needs at least one letter or number');
  });

  it('rejects an over-long title', async () => {
    const res = await create('x'.repeat(TITLE_MAX + 1));
    expect(res.status).toBe(400);
  });

  it('rejects malformed JSON', async () => {
    const res = await request(app).post('/api/todos').type('json').send('{"title":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_JSON');
  });
});

describe('GET /api/todos', () => {
  it('returns todos newest first', async () => {
    await create('first');
    await create('second');
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(200);
    expect(res.body.map((t: { title: string }) => t.title)).toEqual(['second', 'first']);
  });
});

describe('PUT /api/todos/:id', () => {
  it('replaces title and description but ignores done', async () => {
    const { body: todo } = await create('Old', 'old description');
    const res = await request(app).put(`/api/todos/${todo.id}`).send({ title: 'New', done: true });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: todo.id, title: 'New', description: '', done: false });
  });

  it('returns 400 for a blank title, an invalid id, and 404 for a missing todo', async () => {
    const { body: todo } = await create('Keep');
    expect((await request(app).put(`/api/todos/${todo.id}`).send({ title: '' })).status).toBe(400);

    const badId = await request(app).put('/api/todos/not-an-id').send({ title: 'x' });
    expect(badId.status).toBe(400);
    expect(badId.body.error.code).toBe('INVALID_ID');

    const missing = await request(app).put(`/api/todos/${missingId}`).send({ title: 'x' });
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');
  });
});

describe('PATCH /api/todos/:id/done', () => {
  it('flips done and back again', async () => {
    const { body: todo } = await create('Toggle me');
    const once = await request(app).patch(`/api/todos/${todo.id}/done`);
    expect(once.status).toBe(200);
    expect(once.body.done).toBe(true);
    const twice = await request(app).patch(`/api/todos/${todo.id}/done`);
    expect(twice.body.done).toBe(false);
  });

  it('returns 400 for an invalid id and 404 for a missing todo', async () => {
    expect((await request(app).patch('/api/todos/not-an-id/done')).status).toBe(400);
    expect((await request(app).patch(`/api/todos/${missingId}/done`)).status).toBe(404);
  });
});

describe('DELETE /api/todos/:id', () => {
  it('deletes a todo', async () => {
    const { body: todo } = await create('Remove me');
    expect((await request(app).delete(`/api/todos/${todo.id}`)).status).toBe(204);
    expect((await request(app).get('/api/todos')).body).toEqual([]);
  });

  it('returns 400 for an invalid id and 404 for a missing todo', async () => {
    expect((await request(app).delete('/api/todos/not-an-id')).status).toBe(400);
    expect((await request(app).delete(`/api/todos/${missingId}`)).status).toBe(404);
  });
});

describe('rate limiting', () => {
  it('returns 429 in the standard error shape once the limit is passed', async () => {
    const limited = createApp({ clientOrigin: 'http://localhost:5173', rateLimitPerMinute: 2 });
    expect((await request(limited).get('/api/todos')).status).toBe(200);
    expect((await request(limited).get('/api/todos')).status).toBe(200);
    const res = await request(limited).get('/api/todos');
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
    // The health check is not limited
    expect((await request(limited).get('/api/health')).status).toBe(200);
  });
});
