import { z } from 'zod';
import { TASK_PRIORITIES, TASK_STATUSES } from '../models/Task';

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const nullableObjectId = z
  .union([objectId, z.literal(''), z.null()])
  .transform((v) => (v === '' || v == null ? null : v));

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(160),
  description: z.string().trim().max(5000).optional().default(''),
  priority: z.enum(TASK_PRIORITIES as [string, ...string[]]).optional(),
  status: z.enum(TASK_STATUSES as [string, ...string[]]).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  assignedTo: nullableObjectId.optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(5000),
    priority: z.enum(TASK_PRIORITIES as [string, ...string[]]),
    status: z.enum(TASK_STATUSES as [string, ...string[]]),
    dueDate: z.coerce.date().nullable(),
    assignedTo: nullableObjectId,
    rank: z.string().min(1).max(64),
  })
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one field is required',
  });

export const listTasksQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(TASK_STATUSES as [string, ...string[]]).optional(),
  priority: z.enum(TASK_PRIORITIES as [string, ...string[]]).optional(),
  assignedTo: objectId.optional(),
  sort: z
    .enum(['createdAt', '-createdAt', 'dueDate', '-dueDate', 'priority', '-priority'])
    .optional()
    .default('-createdAt'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(500).optional().default(10),
});

export const idParamSchema = z.object({ id: objectId });

export const bulkIdsSchema = z.object({
  ids: z.array(objectId).min(1).max(200),
});

export const bulkUpdateSchema = z
  .object({
    ids: z.array(objectId).min(1).max(200),
    status: z.enum(TASK_STATUSES as [string, ...string[]]).optional(),
    assignedTo: nullableObjectId.optional(),
  })
  .refine((obj) => obj.status !== undefined || obj.assignedTo !== undefined, {
    message: 'At least one of status or assignedTo is required',
  });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type BulkIdsInput = z.infer<typeof bulkIdsSchema>;
export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>;
