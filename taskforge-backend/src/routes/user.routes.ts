import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProfileSchema, changePasswordSchema } from '../validators/auth.validator';
import { listUsers, updateMe, changePassword } from '../controllers/user.controller';

const router = Router();

router.get('/', authenticate, asyncHandler(listUsers));
router.patch('/me', authenticate, validate({ body: updateProfileSchema }), asyncHandler(updateMe));
router.patch('/me/password', authenticate, validate({ body: changePasswordSchema }), asyncHandler(changePassword));

export default router;
