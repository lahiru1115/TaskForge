import { Request } from 'express';
import { ITask } from '../models/Task';

export type ScopeFilter = Record<string, unknown>;

/**
 * Base filter for task/comment queries once a workspace is resolved: this
 * workspace, not soft-deleted. Every member sees everything in it regardless
 * of role — the old per-user narrowing survives only as opt-in `?mine=true`,
 * never the default and never a security boundary.
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
  return task.workspace.equals(req.workspace!._id);
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
 * Any write — create a task, add a comment, or (without full manage rights)
 * move a task's status/rank. Excludes only `viewer`; every other role can write.
 */
export function canWrite(req: Request): boolean {
  const role = req.membership!.role;
  return role === 'owner' || role === 'admin' || role === 'member';
}
