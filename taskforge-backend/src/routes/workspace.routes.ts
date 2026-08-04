import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { resolveWorkspace } from '../middleware/workspace';
import taskRoutes from './task.routes';

const router = Router();

router.use(authenticate);

// Workspace CRUD, member management, and invites land separately — this only
// wires up the task/comment surface for now.
router.use('/:slug/tasks', resolveWorkspace, taskRoutes);

export default router;
