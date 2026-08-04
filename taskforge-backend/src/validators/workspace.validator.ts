import { z } from 'zod';
import { WORKSPACE_ROLES } from '../models/WorkspaceMember';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(50)
  .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only');

// Never accepts 'owner' — no ownership-transfer feature, so it can't be
// granted through the member-role or invite endpoints.
const assignableRole = z.enum(WORKSPACE_ROLES.filter((r) => r !== 'owner') as [string, ...string[]]);

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  slug,
});

export const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
});

export const memberParamsSchema = z.object({ userId: objectId });

export const listMembersQuerySchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const updateMemberSchema = z.object({
  role: assignableRole,
});

export const createInviteSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Invalid email address')),
  role: assignableRole,
});

export const inviteParamsSchema = z.object({ inviteId: objectId });

export const tokenParamSchema = z.object({ token: z.string().min(32) });

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type CreateInviteInput = z.infer<typeof createInviteSchema>;
