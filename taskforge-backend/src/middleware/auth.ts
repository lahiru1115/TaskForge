import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Verifies the Bearer token, loads the user, and attaches it to req.user.
 */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    // Cookie is the primary auth mechanism; Authorization header is a fallback for API clients.
    const token: string | undefined =
      req.cookies?.tf_token ??
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice('Bearer '.length).trim()
        : undefined);

    if (!token) {
      throw ApiError.unauthorized('Not authenticated');
    }
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      throw ApiError.unauthorized('User no longer exists');
    }

    req.user = user;
    next();
  }
);

/**
 * Restricts a route to one of the given roles. Must run after authenticate.
 */
export const requireRole =
  (...roles: Array<'admin' | 'user'>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw ApiError.forbidden('Insufficient permissions');
    }
    next();
  };
