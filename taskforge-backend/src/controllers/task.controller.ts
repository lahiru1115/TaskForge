import { Request, Response } from 'express';
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';
import { Task, ITask, TASK_STATUSES, TaskPriority, TaskStatus } from '../models/Task';
import { ApiError } from '../utils/ApiError';
import { IUser } from '../models/User';
import {
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksQuery,
} from '../validators/task.validator';

type ValidatedReq = Request & { validatedQuery: unknown };

type TaskFilter = Record<string, unknown>;

function visibilityFilter(user: IUser): TaskFilter {
  if (user.role === 'admin') return {};
  const id = user._id;
  return { $or: [{ createdBy: id }, { assignedTo: id }] };
}

function canView(task: ITask, user: IUser): boolean {
  const id = user._id.toString();
  return (
    user.role === 'admin' ||
    task.createdBy.toString() === id ||
    (task.assignedTo != null && task.assignedTo.toString() === id)
  );
}

function canManage(task: ITask, user: IUser): boolean {
  return (
    user.role === 'admin' || task.createdBy.toString() === user._id.toString()
  );
}

const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  createdAt: { createdAt: 1 },
  '-createdAt': { createdAt: -1 },
  dueDate: { dueDate: 1 },
  '-dueDate': { dueDate: -1 },
  priority: { priority: 1 },
  '-priority': { priority: -1 },
};

export async function listTasks(req: Request, res: Response) {
  const q = (req as ValidatedReq).validatedQuery as ListTasksQuery;
  const user = req.user!;

  const filter: TaskFilter = { ...visibilityFilter(user) };

  if (q.search) {
    filter.title = { $regex: q.search, $options: 'i' };
  }
  if (q.status) filter.status = q.status as TaskStatus;
  if (q.priority) filter.priority = q.priority as TaskPriority;
  if (q.assignedTo) filter.assignedTo = q.assignedTo;

  const sort = SORT_MAP[q.sort ?? '-createdAt'] ?? { createdAt: -1 };
  const page = q.page ?? 1;
  const limit = q.limit ?? 10;
  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email'),
    Task.countDocuments(filter),
  ]);

  res.json({
    tasks,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

export async function getTaskStats(req: Request, res: Response) {
  const user = req.user!;
  const filter = visibilityFilter(user);
  const now = new Date();

  const [byStatus, byPriority, overdueCount] = await Promise.all([
    Task.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Task.aggregate([
      { $match: filter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    Task.countDocuments({
      ...filter,
      dueDate: { $lt: now },
      status: { $ne: 'done' },
    }),
  ]);

  const statusCounts = Object.fromEntries(
    TASK_STATUSES.map((s) => [s, 0])
  ) as Record<string, number>;
  for (const row of byStatus) statusCounts[row._id as string] = row.count as number;

  const priorityCounts: Record<string, number> = { low: 0, medium: 0, high: 0 };
  for (const row of byPriority) priorityCounts[row._id as string] = row.count as number;

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  res.json({ total, overdue: overdueCount, byStatus: statusCounts, byPriority: priorityCounts });
}

export async function createTask(req: Request, res: Response) {
  const body = req.body as CreateTaskInput;
  const status = (body.status as TaskStatus | undefined) ?? 'open';
  const lastRanked = await Task.findOne({ status }).sort({ rank: -1 }).select('rank').lean();
  const rank = generateKeyBetween(lastRanked?.rank ?? null, null);
  const doc = {
    title: body.title,
    description: body.description,
    priority: body.priority as TaskPriority | undefined,
    status,
    dueDate: body.dueDate,
    assignedTo: body.assignedTo ?? null,
    createdBy: req.user!._id,
    rank,
  };
  const task = await Task.create(doc);
  await task.populate([
    { path: 'createdBy', select: 'name email' },
    { path: 'assignedTo', select: 'name email' },
  ]);
  res.status(201).json({ task });
}

export async function getTask(req: Request, res: Response) {
  const { id } = req.params;
  const task = await Task.findById(id);

  if (!task || !canView(task, req.user!)) throw ApiError.notFound('Task not found');

  await task.populate([
    { path: 'createdBy', select: 'name email' },
    { path: 'assignedTo', select: 'name email' },
  ]);

  res.json({ task });
}

export async function updateTask(req: Request, res: Response) {
  const { id } = req.params;
  const body = req.body as UpdateTaskInput;
  const user = req.user!;

  const task = await Task.findById(id);
  if (!task || !canView(task, user)) throw ApiError.notFound('Task not found');

  if (!canManage(task, user)) {
    const keys = Object.keys(body);
    if (keys.some((k) => k !== 'status' && k !== 'rank')) {
      throw ApiError.forbidden('You may only update the status of this task');
    }
  }

  Object.assign(task, body);
  await task.save();

  await task.populate([
    { path: 'createdBy', select: 'name email' },
    { path: 'assignedTo', select: 'name email' },
  ]);

  res.json({ task });
}

export async function deleteTask(req: Request, res: Response) {
  const { id } = req.params;
  const user = req.user!;

  const task = await Task.findById(id);
  if (!task || !canView(task, user)) throw ApiError.notFound('Task not found');
  if (!canManage(task, user)) throw ApiError.forbidden('Insufficient permissions');

  await task.deleteOne();
  res.status(204).send();
}
