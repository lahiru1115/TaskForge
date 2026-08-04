import { Schema, model, Document, Types } from 'mongoose';

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';
export type MembershipStatus = 'active' | 'invited';

export const WORKSPACE_ROLES: WorkspaceRole[] = ['owner', 'admin', 'member', 'viewer'];

export interface IWorkspaceMember extends Document {
  _id: Types.ObjectId;
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  role: WorkspaceRole;
  status: MembershipStatus;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceMemberSchema = new Schema<IWorkspaceMember>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: WORKSPACE_ROLES, default: 'member' },
    status: { type: String, enum: ['active', 'invited'], default: 'active' },
  },
  { timestamps: true },
);

// A user has exactly one membership row per workspace.
workspaceMemberSchema.index({ workspace: 1, user: 1 }, { unique: true });
// "List my workspaces" — the hot query the embedded-array alternative couldn't serve.
workspaceMemberSchema.index({ user: 1, status: 1 });
// "List a workspace's admins/owners" for role-gated operations.
workspaceMemberSchema.index({ workspace: 1, role: 1 });

export const WorkspaceMember = model<IWorkspaceMember>('WorkspaceMember', workspaceMemberSchema);
