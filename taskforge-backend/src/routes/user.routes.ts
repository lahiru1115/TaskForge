import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProfileSchema, changePasswordSchema } from '../validators/auth.validator';
import { updateMe, changePassword } from '../controllers/user.controller';

const router = Router();

// Global "list all users" is gone — GET /api/workspaces/:slug/members replaces
// it, scoped to co-members instead of every user in the database.
router.patch('/me', authenticate, validate({ body: updateProfileSchema }), asyncHandler(updateMe));
router.patch('/me/password', authenticate, validate({ body: changePasswordSchema }), asyncHandler(changePassword));

export default router;
