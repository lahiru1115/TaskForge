import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['open', 'in_progress', 'testing', 'done']).optional(),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
})

// Mirrors the backend's slug validation (workspace.validator.ts) so a bad
// slug is caught here, not just as a 400 after submit.
export const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  slug: z
    .string()
    .min(2, 'URL must be at least 2 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only'),
})

export const createInviteSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  role: z.enum(['admin', 'member', 'viewer']),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type TaskInput = z.infer<typeof taskSchema>
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>
export type CreateInviteInput = z.infer<typeof createInviteSchema>
