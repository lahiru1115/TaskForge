import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { acceptInvite } from '../controllers/invite.controller';
import { tokenParamSchema } from '../validators/workspace.validator';

const router = Router();

router.use(authenticate);

// Not nested under /:slug — the token identifies the workspace, and the
// caller isn't a member yet, so resolveWorkspace can't run here.
router.post('/:token/accept', validate({ params: tokenParamSchema }), asyncHandler(acceptInvite));

export default router;
