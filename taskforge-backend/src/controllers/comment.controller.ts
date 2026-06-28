import { Request, Response } from 'express';
import { Task } from '../models/Task';
import { Comment } from '../models/Comment';
import { IUser } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { AddCommentInput } from '../validators/comment.validator';

type TaskFilter = Record<string, unknown>;

function visibilityFilter(user: IUser): TaskFilter {
  if (user.role === 'admin') return {};
  return { $or: [{ createdBy: user._id }, { assignedTo: user._id }] };
}

async function resolveTask(taskId: string, user: IUser) {
  const task = await Task.findOne({ _id: taskId, ...visibilityFilter(user) });
  if (!task) throw ApiError.notFound('Task not found');
  return task;
}

export async function listComments(req: Request, res: Response) {
  const taskId = req.params.id as string;
  await resolveTask(taskId, req.user!);
  const comments = await Comment.find({ task: taskId }).sort({ createdAt: 1 });
  res.json({ comments });
}

export async function addComment(req: Request, res: Response) {
  const taskId = req.params.id as string;
  await resolveTask(taskId, req.user!);
  const { body } = req.body as AddCommentInput;
  const comment = await Comment.create({
    task: taskId,
    author: req.user!._id,
    authorName: req.user!.name,
    body,
  });
  res.status(201).json({ comment });
}

export async function deleteComment(req: Request, res: Response) {
  const taskId = req.params.id as string;
  const commentId = req.params.commentId as string;
  const task = await resolveTask(taskId, req.user!);
  const comment = await Comment.findOne({ _id: commentId, task: task._id });
  if (!comment) throw ApiError.notFound('Comment not found');

  const isAuthor = comment.author.toString() === req.user!._id.toString();
  if (!isAuthor && req.user!.role !== 'admin') {
    throw ApiError.notFound('Comment not found');
  }

  await comment.deleteOne();
  res.status(204).end();
}
