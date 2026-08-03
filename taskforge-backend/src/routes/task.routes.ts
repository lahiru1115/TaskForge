import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
  idParamSchema,
} from '../validators/task.validator';
import {
  listTasks,
  listTrash,
  getTaskStats,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  restoreTask,
  permanentlyDeleteTask,
  getTaskActivity,
} from '../controllers/task.controller';
import { listComments, addComment, deleteComment } from '../controllers/comment.controller';
import { addCommentSchema, commentParamsSchema } from '../validators/comment.validator';

const router = Router();

router.use(authenticate);

router.get('/stats', asyncHandler(getTaskStats));
router.get('/trash', asyncHandler(listTrash));
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
