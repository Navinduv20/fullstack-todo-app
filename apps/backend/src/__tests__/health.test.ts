import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('app shell', () => {
  const app = createApp({ clientOrigin: 'http://localhost:5173' });

  it('GET /api/health responds', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('answers 503 straight away when the database is not connected', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DB_UNAVAILABLE');
  });

  it('unknown routes return the standard 404 shape', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
