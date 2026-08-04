import { Request, Response } from 'express';
import { Task } from '../models/Task';
import { Comment } from '../models/Comment';
import { ApiError } from '../utils/ApiError';
import { scopeFilter, canWrite } from '../services/authz';
import { AddCommentInput } from '../validators/comment.validator';

async function resolveTask(taskId: string, req: Request) {
  const task = await Task.findOne({ _id: taskId, ...scopeFilter(req) });
  if (!task) throw ApiError.notFound('Task not found');
  return task;
}

export async function listComments(req: Request, res: Response) {
  const taskId = req.params.id as string;
  await resolveTask(taskId, req);
  const comments = await Comment.find({ task: taskId }).sort({ createdAt: 1 });
  res.json({ comments });
}

export async function addComment(req: Request, res: Response) {
  if (!canWrite(req)) throw ApiError.forbidden('Viewers cannot comment');

  const taskId = req.params.id as string;
  await resolveTask(taskId, req);
  const { body } = req.body as AddCommentInput;
  const comment = await Comment.create({
    task: taskId,
    workspace: req.workspace!._id,
    author: req.user!._id,
    authorName: req.user!.name,
    body,
  });
  res.status(201).json({ comment });
}

export async function deleteComment(req: Request, res: Response) {
  const taskId = req.params.id as string;
  const commentId = req.params.commentId as string;
  const task = await resolveTask(taskId, req);
  const comment = await Comment.findOne({ _id: commentId, task: task._id });
  if (!comment) throw ApiError.notFound('Comment not found');

  const isAuthor = comment.author.toString() === req.user!._id.toString();
  const role = req.membership!.role;
  const isWorkspaceManager = role === 'owner' || role === 'admin';
  if (!isAuthor && !isWorkspaceManager) {
    throw ApiError.notFound('Comment not found');
  }

  await comment.deleteOne();
  res.status(204).end();
}
