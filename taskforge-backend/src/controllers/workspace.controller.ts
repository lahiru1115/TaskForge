import { Request, Response } from 'express';
import { Workspace } from '../models/Workspace';
import { WorkspaceMember, WorkspaceRole } from '../models/WorkspaceMember';
import { Invite } from '../models/Invite';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { Comment } from '../models/Comment';
import { Activity } from '../models/Activity';
import { ApiError } from '../utils/ApiError';
import {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  ListMembersQuery,
  UpdateMemberInput,
} from '../validators/workspace.validator';

type ValidatedReq = Request & { validatedQuery: unknown };

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listWorkspaces(req: Request, res: Response) {
  const memberships = await WorkspaceMember.find({ user: req.user!._id, status: 'active' })
    .populate('workspace')
    .sort({ createdAt: 1 });

  const workspaces = memberships
    .filter((m) => m.workspace != null)
    .map((m) => ({ workspace: m.workspace, role: m.role }));

  res.json({ workspaces });
}

export async function createWorkspace(req: Request, res: Response) {
  const { workspaceName, organizationName, slug } = req.body as CreateWorkspaceInput;

  const existing = await Workspace.findOne({ slug });
  if (existing) throw ApiError.conflict('That workspace URL is already taken');

  const workspace = await Workspace.create({ workspaceName, organizationName, slug, owner: req.user!._id });
  await WorkspaceMember.create({
    workspace: workspace._id,
    user: req.user!._id,
    role: 'owner',
    status: 'active',
  });

  res.status(201).json({ workspace });
}

export async function getWorkspace(req: Request, res: Response) {
  res.json({ workspace: req.workspace, role: req.membership!.role });
}

export async function updateWorkspace(req: Request, res: Response) {
  const { workspaceName, organizationName } = req.body as UpdateWorkspaceInput;

  const workspace = req.workspace!;
  workspace.workspaceName = workspaceName;
  workspace.organizationName = organizationName;
  await workspace.save();

  res.json({ workspace });
}

export async function deleteWorkspace(req: Request, res: Response) {
  const workspaceId = req.workspace!._id;

  // Children first, then the workspace — no FK enforcement in Mongo, but the
  // safer order if this gets interrupted mid-way.
  await Promise.all([
    Task.deleteMany({ workspace: workspaceId }),
    Comment.deleteMany({ workspace: workspaceId }),
    Activity.deleteMany({ workspace: workspaceId }),
    WorkspaceMember.deleteMany({ workspace: workspaceId }),
    Invite.deleteMany({ workspace: workspaceId }),
  ]);
  await req.workspace!.deleteOne();

  res.status(204).send();
}

export async function listMembers(req: Request, res: Response) {
  const q = (req as ValidatedReq).validatedQuery as ListMembersQuery;
  const page = q.page ?? 1;
  const limit = q.limit ?? 20;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { workspace: req.workspace!._id, status: 'active' };

  if (q.q) {
    const prefix = new RegExp('^' + escapeRegExp(q.q), 'i');
    const matches = await User.find({ $or: [{ name: prefix }, { email: prefix }] }).select('_id');
    filter.user = { $in: matches.map((u) => u._id) };
  }

  const [members, total] = await Promise.all([
    WorkspaceMember.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email'),
    WorkspaceMember.countDocuments(filter),
  ]);

  res.json({ members, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function updateMember(req: Request, res: Response) {
  const { userId } = req.params;
  const { role } = req.body as UpdateMemberInput;

  const membership = await WorkspaceMember.findOne({ workspace: req.workspace!._id, user: userId });
  if (!membership) throw ApiError.notFound('Member not found');
  if (membership.role === 'owner') {
    throw ApiError.forbidden("Cannot change the workspace owner's role");
  }

  membership.role = role as WorkspaceRole;
  await membership.save();

  res.json({ member: membership });
}

export async function removeMember(req: Request, res: Response) {
  const { userId } = req.params;

  const isSelf = userId === req.user!._id.toString();
  const role = req.membership!.role;
  const isWorkspaceManager = role === 'owner' || role === 'admin';
  if (!isSelf && !isWorkspaceManager) {
    throw ApiError.forbidden('Insufficient permissions');
  }

  const membership = await WorkspaceMember.findOne({ workspace: req.workspace!._id, user: userId });
  if (!membership) throw ApiError.notFound('Member not found');
  if (membership.role === 'owner') {
    throw ApiError.forbidden('Cannot remove the workspace owner');
  }

  await membership.deleteOne();
  res.status(204).send();
}
