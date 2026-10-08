import type { RequestHandler, RequestParamHandler } from 'express';
import mongoose from 'mongoose';
import type { ZodType } from 'zod';
import { HttpError } from './errorHandler';

// req.body becomes the parsed value: trimmed, defaults applied, unknown keys dropped
export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    req.body = schema.parse(req.body ?? {});
    next();
  };

export const validateObjectId: RequestParamHandler = (_req, _res, next, id) => {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'INVALID_ID', 'Invalid todo id');
  next();
};
