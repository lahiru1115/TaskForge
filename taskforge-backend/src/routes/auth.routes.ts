import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { register, login, me } from '../controllers/auth.controller';

const router = Router();

router.post('/register', validate({ body: registerSchema }), asyncHandler(register));
router.post('/login', validate({ body: loginSchema }), asyncHandler(login));
router.get('/me', authenticate, asyncHandler(me));

export default router;
