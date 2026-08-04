import crypto from 'crypto';
import { Request, Response } from 'express';
import { Invite } from '../models/Invite';
import { WorkspaceMember, WorkspaceRole } from '../models/WorkspaceMember';
import { ApiError } from '../utils/ApiError';
import { CreateInviteInput } from '../validators/workspace.validator';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createInvite(req: Request, res: Response) {
  const { email, role } = req.body as CreateInviteInput;

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);

  const invite = await Invite.create({
    workspace: req.workspace!._id,
    email,
    role: role as WorkspaceRole,
    tokenHash,
    invitedBy: req.user!._id,
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  });

  // Email delivery is Phase 3. Token is returned once here — only its hash
  // is persisted, so it's unrecoverable after this.
  res.status(201).json({
    invite: { _id: invite._id, email: invite.email, role: invite.role, expiresAt: invite.expiresAt },
    token,
  });
}

export async function listInvites(req: Request, res: Response) {
  const invites = await Invite.find({ workspace: req.workspace!._id, acceptedAt: null })
    .select('-tokenHash')
    .sort({ createdAt: -1 });

  res.json({ invites });
}

export async function revokeInvite(req: Request, res: Response) {
  const { inviteId } = req.params;

  const invite = await Invite.findOne({ _id: inviteId, workspace: req.workspace!._id });
  if (!invite) throw ApiError.notFound('Invite not found');

  await invite.deleteOne();
  res.status(204).send();
}

export async function acceptInvite(req: Request, res: Response) {
  const token = req.params.token as string;
  const tokenHash = hashToken(token);

  const invite = await Invite.findOne({ tokenHash });
  // The TTL index garbage-collects expired invites eventually, not instantly —
  // this check is what actually enforces expiry.
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    throw ApiError.notFound('Invite not found or expired');
  }

  const user = req.user!;
  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw ApiError.forbidden('This invite was sent to a different email address');
  }

  const existing = await WorkspaceMember.findOne({ workspace: invite.workspace, user: user._id });
  if (existing) {
    if (existing.status !== 'active') {
      existing.status = 'active';
      await existing.save();
    }
  } else {
    await WorkspaceMember.create({
      workspace: invite.workspace,
      user: user._id,
      role: invite.role,
      status: 'active',
    });
  }

  invite.acceptedAt = new Date();
  await invite.save();

  res.json({ workspaceId: invite.workspace });
}
