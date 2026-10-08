import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import mongoose from 'mongoose';
import { todosRouter } from './routes/todos';
import { errorHandler, HttpError } from './middleware/errorHandler';

interface AppOptions {
  clientOrigin: string;
  // per IP, on /api/todos
  rateLimitPerMinute?: number;
}

export function createApp({ clientOrigin, rateLimitPerMinute = 50 }: AppOptions) {
  const app = express();

  const todosLimiter = rateLimit({
    windowMs: 60_000,
    limit: rateLimitPerMinute,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again in a moment.',
        },
      });
    },
  });

  app.use(helmet());
  app.use(cors({ origin: clientOrigin }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'up' : 'down' });
  });

  // Without this Mongoose buffers the query for 10s when the DB is down, and can still run
  // it after the client has timed out.
  const requireDb: express.RequestHandler = (_req, _res, next) => {
    if (mongoose.connection.readyState !== 1) {
      throw new HttpError(503, 'DB_UNAVAILABLE', 'The database is unavailable');
    }
    next();
  };

  app.use('/api/todos', todosLimiter, requireDb, todosRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  app.use(errorHandler);

  return app;
}
