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
  getTaskStats,
  createTask,
  getTask,
  updateTask,
  deleteTask,
} from '../controllers/task.controller';

const router = Router();

router.use(authenticate);

router.get('/stats', asyncHandler(getTaskStats));
router.get('/', validate({ query: listTasksQuerySchema }), asyncHandler(listTasks));
router.post('/', validate({ body: createTaskSchema }), asyncHandler(createTask));
router.get('/:id', validate({ params: idParamSchema }), asyncHandler(getTask));
router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateTaskSchema }),
  asyncHandler(updateTask)
);
router.delete('/:id', validate({ params: idParamSchema }), asyncHandler(deleteTask));

export default router;
