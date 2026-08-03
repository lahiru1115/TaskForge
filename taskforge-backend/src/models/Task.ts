import { Schema, model, Document, Types } from 'mongoose';

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'open' | 'in_progress' | 'testing' | 'done';

export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];
export const TASK_STATUSES: TaskStatus[] = [
  'open',
  'in_progress',
  'testing',
  'done',
];

export interface ITask extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date | null;
  rank: string;
  createdBy: Types.ObjectId;
  assignedTo: Types.ObjectId | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'medium' },
    status: { type: String, enum: TASK_STATUSES, default: 'open' },
    dueDate: { type: Date, default: null },
    rank: { type: String, default: '' },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

taskSchema.index({ status: 1, rank: 1 });

export const Task = model<ITask>('Task', taskSchema);
