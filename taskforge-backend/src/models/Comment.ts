import { Schema, model, Document, Types } from 'mongoose';

export interface IComment extends Document {
  task: Types.ObjectId;
  author: Types.ObjectId;
  authorName: string;
  body: string;
  // Optional during the Phase 1 migration window (see docs/SCALING.md) — becomes required once
  // migrate-001-workspaces.ts has backfilled every existing doc. Denormalized from the parent
  // task so a scope check never has to load it first.
  workspace?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    body: { type: String, required: true, maxlength: 5000 },
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', index: true },
  },
  { timestamps: true },
);

export const Comment = model<IComment>('Comment', commentSchema);
