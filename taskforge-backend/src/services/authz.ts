import { Request } from 'express';
import { ITask } from '../models/Task';

export type ScopeFilter = Record<string, unknown>;

/**
 * The base Mongo filter for every task/comment list or aggregate query once a
 * workspace has been resolved: everything in this workspace, not soft-deleted.
 * Every active member — any role — can see everything in their workspace; the
 * old per-user narrowing survives only as an opt-in `?mine=true` UI filter,
 * never as the default and never as a security boundary.
 */
export function scopeFilter(req: Request, opts: { mine?: boolean } = {}): ScopeFilter {
  const filter: ScopeFilter = { workspace: req.workspace!._id, deletedAt: null };
  if (opts.mine) {
    filter.$or = [{ createdBy: req.user!._id }, { assignedTo: req.user!._id }];
  }
  return filter;
}

/**
 * Can the caller see this specific task at all? Once resolveWorkspace has
 * confirmed membership, the only remaining check is that the task actually
 * belongs to the workspace named in the URL — not the caller's role.
 */
export function canView(task: ITask, req: Request): boolean {
  return !!task.workspace && task.workspace.equals(req.workspace!._id);
}

/**
 * Full edit + delete rights: workspace owner/admin, or whoever created the task.
 */
export function canManage(task: ITask, req: Request): boolean {
  const role = req.membership!.role;
  if (role === 'owner' || role === 'admin') return true;
  return task.createdBy.equals(req.user!._id);
}

/**
 * Any write action at all — create a task, add a comment, or (without full
 * manage rights) move an existing task's status/rank. `viewer` is the only
 * role this excludes; everyone else in the workspace can write.
 */
export function canWrite(req: Request): boolean {
  const role = req.membership!.role;
  return role === 'owner' || role === 'admin' || role === 'member';
}
