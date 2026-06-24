import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
import { ApiError } from '../utils/ApiError';

type Schemas = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

/**
 * Validates and coerces request parts against the given Zod schemas.
 * Parsed values replace the originals so controllers get typed, clean input.
 */
export const validate =
  (schemas: Schemas) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        // req.query is read-only in Express 5; expose parsed copy instead.
        (req as Request & { validatedQuery: unknown }).validatedQuery = parsed;
      }
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      next();
    } catch (err) {
      const anyErr = err as { issues?: Array<{ path: (string | number)[]; message: string }> };
      if (anyErr.issues) {
        const message = anyErr.issues
          .map((i) => `${i.path.join('.') || 'field'}: ${i.message}`)
          .join('; ');
        next(ApiError.badRequest(message));
        return;
      }
      next(err);
    }
  };
