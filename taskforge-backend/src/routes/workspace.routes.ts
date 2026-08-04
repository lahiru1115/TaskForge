import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { resolveWorkspace, requireWorkspaceRole } from '../middleware/workspace';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  memberParamsSchema,
  listMembersQuerySchema,
  updateMemberSchema,
  createInviteSchema,
  inviteParamsSchema,
} from '../validators/workspace.validator';
import {
  listWorkspaces,
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  listMembers,
  updateMember,
  removeMember,
} from '../controllers/workspace.controller';
import { createInvite, listInvites, revokeInvite } from '../controllers/invite.controller';
import taskRoutes from './task.routes';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(listWorkspaces));
router.post('/', validate({ body: createWorkspaceSchema }), asyncHandler(createWorkspace));

router.get('/:slug', resolveWorkspace, asyncHandler(getWorkspace));
router.patch(
  '/:slug',
  resolveWorkspace,
  requireWorkspaceRole('owner', 'admin'),
  validate({ body: updateWorkspaceSchema }),
  asyncHandler(updateWorkspace)
);
router.delete('/:slug', resolveWorkspace, requireWorkspaceRole('owner'), asyncHandler(deleteWorkspace));

router.get(
  '/:slug/members',
  resolveWorkspace,
  validate({ query: listMembersQuerySchema }),
  asyncHandler(listMembers)
);
router.patch(
  '/:slug/members/:userId',
  resolveWorkspace,
  requireWorkspaceRole('owner', 'admin'),
  validate({ params: memberParamsSchema, body: updateMemberSchema }),
  asyncHandler(updateMember)
);
// No blanket requireWorkspaceRole — removeMember also allows self-removal
// (leaving), not just owner/admin removing someone else.
router.delete(
  '/:slug/members/:userId',
  resolveWorkspace,
  validate({ params: memberParamsSchema }),
  asyncHandler(removeMember)
);

router.post(
  '/:slug/invites',
  resolveWorkspace,
  requireWorkspaceRole('owner', 'admin'),
  validate({ body: createInviteSchema }),
  asyncHandler(createInvite)
);
router.get(
  '/:slug/invites',
  resolveWorkspace,
  requireWorkspaceRole('owner', 'admin'),
  asyncHandler(listInvites)
);
router.delete(
  '/:slug/invites/:inviteId',
  resolveWorkspace,
  requireWorkspaceRole('owner', 'admin'),
  validate({ params: inviteParamsSchema }),
  asyncHandler(revokeInvite)
);

router.use('/:slug/tasks', resolveWorkspace, taskRoutes);

export default router;
