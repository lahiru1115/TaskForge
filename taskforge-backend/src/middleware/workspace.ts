import { Request, Response, NextFunction } from 'express';
import { Workspace } from '../models/Workspace';
import { WorkspaceMember, WorkspaceRole } from '../models/WorkspaceMember';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Loads the workspace named by :slug and the caller's membership, attaching
 * req.workspace / req.membership. Must run after authenticate. Non-existent
 * workspaces and non-members both 404 — no existence leak.
 */
export const resolveWorkspace = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const { slug } = req.params;

    const workspace = await Workspace.findOne({ slug });
    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    const membership = await WorkspaceMember.findOne({
      workspace: workspace._id,
      user: req.user!._id,
      status: 'active',
    });
    if (!membership) {
      throw ApiError.notFound('Workspace not found');
    }

    req.workspace = workspace;
    req.membership = membership;
    next();
  }
);

/**
 * Restricts a route to one or more workspace roles. Must run after resolveWorkspace.
 */
export const requireWorkspaceRole =
  (...roles: WorkspaceRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.membership || !roles.includes(req.membership.role)) {
      throw ApiError.forbidden('Insufficient permissions');
    }
    next();
  };
