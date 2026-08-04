import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
  idParamSchema,
  bulkIdsSchema,
  bulkUpdateSchema,
} from '../validators/task.validator';
import {
  listTasks,
  listTrash,
  getTaskStats,
  createTask,
  getTask,
  updateTask,
  bulkUpdateTasks,
  deleteTask,
  bulkDeleteTasks,
  restoreTask,
  permanentlyDeleteTask,
  getTaskActivity,
} from '../controllers/task.controller';
import { listComments, addComment, deleteComment } from '../controllers/comment.controller';
import { addCommentSchema, commentParamsSchema } from '../validators/comment.validator';

// mergeParams: mounted under /:slug/tasks (see workspace.routes.ts) — needs
// access to the parent's :slug. authenticate + resolveWorkspace already ran
// there, so this router assumes req.user / req.workspace / req.membership.
const router = Router({ mergeParams: true });

router.get('/stats', asyncHandler(getTaskStats));
router.get('/trash', asyncHandler(listTrash));
router.patch('/bulk', validate({ body: bulkUpdateSchema }), asyncHandler(bulkUpdateTasks));
router.delete('/bulk', validate({ body: bulkIdsSchema }), asyncHandler(bulkDeleteTasks));
router.get('/', validate({ query: listTasksQuerySchema }), asyncHandler(listTasks));
router.post('/', validate({ body: createTaskSchema }), asyncHandler(createTask));
router.get('/:id', validate({ params: idParamSchema }), asyncHandler(getTask));
router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateTaskSchema }),
  asyncHandler(updateTask)
);
router.delete('/:id', validate({ params: idParamSchema }), asyncHandler(deleteTask));
router.post('/:id/restore', validate({ params: idParamSchema }), asyncHandler(restoreTask));
router.delete('/:id/permanent', validate({ params: idParamSchema }), asyncHandler(permanentlyDeleteTask));
router.get('/:id/activity', validate({ params: idParamSchema }), asyncHandler(getTaskActivity));
router.get('/:id/comments', validate({ params: idParamSchema }), asyncHandler(listComments));
router.post('/:id/comments', validate({ params: idParamSchema, body: addCommentSchema }), asyncHandler(addComment));
router.delete('/:id/comments/:commentId', validate({ params: commentParamsSchema }), asyncHandler(deleteComment));

export default router;
