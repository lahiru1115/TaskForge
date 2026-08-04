import { Request, Response } from 'express';
import { generateKeyBetween } from 'fractional-indexing';
import { Task, ITask, TASK_STATUSES, TaskPriority, TaskStatus } from '../models/Task';
import { Activity } from '../models/Activity';
import { Comment } from '../models/Comment';
import { ApiError } from '../utils/ApiError';
import { IUser } from '../models/User';
import {
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksQuery,
  BulkIdsInput,
  BulkUpdateInput,
} from '../validators/task.validator';

type ValidatedReq = Request & { validatedQuery: unknown };

type TaskFilter = Record<string, unknown>;

function visibilityFilter(user: IUser): TaskFilter {
  const base = user.role === 'admin' ? {} : { $or: [{ createdBy: user._id }, { assignedTo: user._id }] };
  return { ...base, deletedAt: null };
}

function trashVisibilityFilter(user: IUser): TaskFilter {
  const base = user.role === 'admin' ? {} : { createdBy: user._id };
  return { ...base, deletedAt: { $ne: null } };
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

export async function listTrash(req: Request, res: Response) {
  const user = req.user!;

  const tasks = await Task.find(trashVisibilityFilter(user))
    .sort({ deletedAt: -1 })
    .limit(200)
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email');

  res.json({ tasks });
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

  await Activity.create({
    task: task._id,
    actor: req.user!._id,
    actorName: req.user!.name,
    type: 'created',
  });

  res.status(201).json({ task });
}

export async function getTask(req: Request, res: Response) {
  const { id } = req.params;
  const task = await Task.findById(id);

  if (!task || task.deletedAt || !canView(task, req.user!)) throw ApiError.notFound('Task not found');

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
  if (!task || task.deletedAt || !canView(task, user)) throw ApiError.notFound('Task not found');

  if (!canManage(task, user)) {
    const keys = Object.keys(body);
    if (keys.some((k) => k !== 'status' && k !== 'rank')) {
      throw ApiError.forbidden('You may only update the status of this task');
    }
  }

  // Capture old values before mutation for activity log
  const oldStatus = task.status;
  const oldPriority = task.priority;
  const oldAssignedTo = task.assignedTo?.toString() ?? null;
  const oldTitle = task.title;
  const oldDescription = task.description;
  const oldDueDate = task.dueDate?.toISOString().slice(0, 10) ?? null;

  Object.assign(task, body);
  await task.save();

  await task.populate([
    { path: 'createdBy', select: 'name email' },
    { path: 'assignedTo', select: 'name email' },
  ]);

  // Append activity records for each meaningful change (rank excluded)
  const actorId = req.user!._id;
  const actorName = req.user!.name;
  const acts: Parameters<typeof Activity.create>[0][] = [];

  if (body.status && body.status !== oldStatus) {
    acts.push({ task: task._id, actor: actorId, actorName, type: 'status_changed', from: oldStatus, to: body.status });
  }
  if (body.priority && body.priority !== oldPriority) {
    acts.push({ task: task._id, actor: actorId, actorName, type: 'priority_changed', from: oldPriority, to: body.priority });
  }
  if ('assignedTo' in body) {
    const newAssignedTo = body.assignedTo ?? null;
    if (newAssignedTo !== oldAssignedTo) {
      if (newAssignedTo) {
        const assigneeName = (task.assignedTo as unknown as { name: string } | null)?.name ?? newAssignedTo;
        acts.push({ task: task._id, actor: actorId, actorName, type: 'assigned', to: assigneeName });
      } else {
        acts.push({ task: task._id, actor: actorId, actorName, type: 'unassigned' });
      }
    }
  }
  if (body.title && body.title !== oldTitle) {
    acts.push({ task: task._id, actor: actorId, actorName, type: 'edited', field: 'title' });
  }
  if ('description' in body && body.description !== oldDescription) {
    acts.push({ task: task._id, actor: actorId, actorName, type: 'edited', field: 'description' });
  }
  if ('dueDate' in body) {
    const newDueDate = body.dueDate ? new Date(body.dueDate as unknown as string).toISOString().slice(0, 10) : null;
    if (newDueDate !== oldDueDate) {
      acts.push({ task: task._id, actor: actorId, actorName, type: 'edited', field: 'due date' });
    }
  }

  if (acts.length > 0) await Activity.insertMany(acts);

  res.json({ task });
}

export async function bulkUpdateTasks(req: Request, res: Response) {
  const { ids, status, assignedTo } = req.body as BulkUpdateInput;
  const user = req.user!;

  const tasks = await Task.find({ _id: { $in: ids }, ...visibilityFilter(user) });
  if (tasks.length !== ids.length) throw ApiError.notFound('One or more tasks not found');

  const changesAssignee = assignedTo !== undefined;
  if (changesAssignee && tasks.some((t) => !canManage(t, user))) {
    throw ApiError.forbidden('You may only reassign tasks you created');
  }

  const oldValues = new Map(
    tasks.map((t) => [t._id.toString(), { status: t.status, assignedTo: t.assignedTo?.toString() ?? null }])
  );

  for (const task of tasks) {
    if (status) task.status = status as TaskStatus;
    if (changesAssignee) task.assignedTo = (assignedTo ?? null) as unknown as ITask['assignedTo'];
    await task.save();
  }

  await Task.populate(tasks, [
    { path: 'createdBy', select: 'name email' },
    { path: 'assignedTo', select: 'name email' },
  ]);

  const actorId = user._id;
  const actorName = user.name;
  const acts: Parameters<typeof Activity.create>[0][] = [];

  for (const task of tasks) {
    const old = oldValues.get(task._id.toString())!;
    if (status && status !== old.status) {
      acts.push({ task: task._id, actor: actorId, actorName, type: 'status_changed', from: old.status, to: status });
    }
    if (changesAssignee) {
      const newAssignedTo = assignedTo ?? null;
      if (newAssignedTo !== old.assignedTo) {
        if (newAssignedTo) {
          const assigneeName = (task.assignedTo as unknown as { name: string } | null)?.name ?? newAssignedTo;
          acts.push({ task: task._id, actor: actorId, actorName, type: 'assigned', to: assigneeName });
        } else {
          acts.push({ task: task._id, actor: actorId, actorName, type: 'unassigned' });
        }
      }
    }
  }

  if (acts.length > 0) await Activity.insertMany(acts);

  res.json({ tasks });
}

export async function deleteTask(req: Request, res: Response) {
  const { id } = req.params;
  const user = req.user!;

  const task = await Task.findById(id);
  if (!task || task.deletedAt || !canView(task, user)) throw ApiError.notFound('Task not found');
  if (!canManage(task, user)) throw ApiError.forbidden('Insufficient permissions');

  task.deletedAt = new Date();
  await task.save();
  res.status(204).send();
}

export async function bulkDeleteTasks(req: Request, res: Response) {
  const { ids } = req.body as BulkIdsInput;
  const user = req.user!;

  const tasks = await Task.find({ _id: { $in: ids }, ...visibilityFilter(user) });
  if (tasks.length !== ids.length) throw ApiError.notFound('One or more tasks not found');
  if (tasks.some((t) => !canManage(t, user))) {
    throw ApiError.forbidden('You may only delete tasks you created');
  }

  await Task.updateMany({ _id: { $in: ids } }, { deletedAt: new Date() });

  res.status(204).send();
}

export async function restoreTask(req: Request, res: Response) {
  const { id } = req.params;
  const user = req.user!;

  const task = await Task.findById(id);
  if (!task || !task.deletedAt || !canView(task, user)) throw ApiError.notFound('Task not found');
  if (!canManage(task, user)) throw ApiError.forbidden('Insufficient permissions');

  task.deletedAt = null;
  await task.save();
  await task.populate([
    { path: 'createdBy', select: 'name email' },
    { path: 'assignedTo', select: 'name email' },
  ]);

  res.json({ task });
}

export async function permanentlyDeleteTask(req: Request, res: Response) {
  const { id } = req.params;
  const user = req.user!;

  const task = await Task.findById(id);
  if (!task || !task.deletedAt || !canView(task, user)) throw ApiError.notFound('Task not found');
  if (!canManage(task, user)) throw ApiError.forbidden('Insufficient permissions');

  await Promise.all([
    Activity.deleteMany({ task: task._id }),
    Comment.deleteMany({ task: task._id }),
  ]);
  await task.deleteOne();

  res.status(204).send();
}

export async function getTaskActivity(req: Request, res: Response) {
  const { id } = req.params;
  const user = req.user!;

  const task = await Task.findById(id).lean();
  if (!task || (task as unknown as ITask).deletedAt || !canView(task as unknown as ITask, user)) {
    throw ApiError.notFound('Task not found');
  }

  const activities = await Activity.find({ task: id })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  res.json({ activities });
}
