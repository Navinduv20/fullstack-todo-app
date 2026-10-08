import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import type { ApiErrorBody } from '@todo/shared';

export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type Details = NonNullable<ApiErrorBody['error']['details']>;

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const send = (status: number, code: string, message: string, details?: Details) => {
    const body: ApiErrorBody = { error: { code, message, ...(details && { details }) } };
    res.status(status).json(body);
  };

  if (err instanceof HttpError) return send(err.status, err.code, err.message);

  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return send(400, 'VALIDATION_ERROR', details[0]?.message ?? 'Invalid request', details);
  }

  // express.json() couldn't parse the body
  if (err?.type === 'entity.parse.failed')
    return send(400, 'BAD_JSON', 'Request body is not valid JSON');

  console.error(err);
  send(500, 'INTERNAL', 'Something went wrong');
};
