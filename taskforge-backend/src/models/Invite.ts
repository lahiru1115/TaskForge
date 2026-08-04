import { Schema, model, Document, Types } from 'mongoose';
import { WorkspaceRole, WORKSPACE_ROLES } from './WorkspaceMember';

export interface IInvite extends Document {
  _id: Types.ObjectId;
  workspace: Types.ObjectId;
  email: string;
  role: WorkspaceRole;
  tokenHash: string;
  invitedBy: Types.ObjectId;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const inviteSchema = new Schema<IInvite>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: WORKSPACE_ROLES, default: 'member' },
    // Never store the raw token — only its SHA-256 hash, so a DB read can't mint accepted invites.
    tokenHash: { type: String, required: true, unique: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Absolute-expiry TTL: Mongo drops the doc once expiresAt has passed, not N seconds after creation.
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Invite = model<IInvite>('Invite', inviteSchema);
