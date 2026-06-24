import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import { listUsers } from '../controllers/user.controller';

const router = Router();

router.get('/', authenticate, asyncHandler(listUsers));

export default router;
