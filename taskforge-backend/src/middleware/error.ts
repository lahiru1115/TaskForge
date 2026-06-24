import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ message: err.message });
    return;
  }

  // Mongoose duplicate key (e.g. email already registered)
  const anyErr = err as { code?: number; keyValue?: Record<string, unknown> };
  if (anyErr.code === 11000) {
    const field = Object.keys(anyErr.keyValue || {})[0] || 'field';
    res.status(409).json({ message: `${field} already in use` });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    ...(env.nodeEnv === 'development' && err instanceof Error
      ? { detail: err.message }
      : {}),
  });
}
