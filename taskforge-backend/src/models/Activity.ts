import { Schema, model, Document, Types } from 'mongoose';

export type ActivityType =
  | 'created'
  | 'status_changed'
  | 'priority_changed'
  | 'assigned'
  | 'unassigned'
  | 'edited';

export interface IActivity extends Document {
  task: Types.ObjectId;
  actor: Types.ObjectId;
  actorName: string;
  type: ActivityType;
  field?: string;
  from?: string;
  to?: string;
  // Optional during the Phase 1 migration window (see docs/SCALING.md) — becomes required once
  // migrate-001-workspaces.ts has backfilled every existing doc. Denormalized from the parent
  // task so a scope check never has to load it first.
  workspace?: Types.ObjectId;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorName: { type: String, required: true },
    type: {
      type: String,
      enum: ['created', 'status_changed', 'priority_changed', 'assigned', 'unassigned', 'edited'],
      required: true,
    },
    field: { type: String },
    from: { type: String },
    to: { type: String },
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Activity = model<IActivity>('Activity', activitySchema);
