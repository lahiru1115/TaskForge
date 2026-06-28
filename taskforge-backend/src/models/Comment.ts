import { Schema, model, Document, Types } from 'mongoose';

export interface IComment extends Document {
  task: Types.ObjectId;
  author: Types.ObjectId;
  authorName: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    body: { type: String, required: true, maxlength: 5000 },
  },
  { timestamps: true },
);

export const Comment = model<IComment>('Comment', commentSchema);
