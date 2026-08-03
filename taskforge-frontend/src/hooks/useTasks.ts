import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { TaskInput } from '@/lib/schemas'

export interface TaskUser {
  _id: string
  name: string
  email: string
}

export interface Task {
  _id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in_progress' | 'testing' | 'done'
  dueDate?: string
  rank: string
  createdBy: TaskUser
  assignedTo?: TaskUser | null
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface TaskFilters {
  search?: string
  status?: string
  priority?: string
  assignedTo?: string
  sort?: string
  page?: number
  limit?: number
}

export interface PaginationData {
  page: number
  limit: number
  total: number
  pages: number
}

export interface TasksResponse {
  tasks: Task[]
  pagination: PaginationData
}

export function useTasks(filters: TaskFilters = {}) {
  return useQuery<TasksResponse>({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined),
      )
      const { data } = await api.get('/api/tasks', { params })
      return data
    },
  })
}

export function useTask(id: string) {
  return useQuery<Task>({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/tasks/${id}`)
      return data.task
    },
    enabled: !!id,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: TaskInput) => {
      const { data } = await api.post('/api/tasks', body)
      return data.task as Task
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<TaskInput>) => {
      const { data } = await api.patch(`/api/tasks/${id}`, body)
      return data.task as Task
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['activity', id] })
    },
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/tasks/${id}`)
      return id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export interface BulkUpdatePayload {
  ids: string[]
  status?: Task['status']
  assignedTo?: string | null
  /** Optimistic-only — the full user object to show immediately; not sent to the server. */
  assignedToUser?: TaskUser | null
}

export function useBulkUpdateTasks() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ assignedToUser: _assignedToUser, ...body }: BulkUpdatePayload) => {
      const { data } = await api.patch('/api/tasks/bulk', body)
      return data.tasks as Task[]
    },
    onMutate: async ({ ids, status, assignedTo, assignedToUser }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const snapshot = qc.getQueriesData<TasksResponse>({ queryKey: ['tasks'] })
      const idSet = new Set(ids)
      qc.setQueriesData<TasksResponse>({ queryKey: ['tasks'] }, (old) => {
        if (!old?.tasks) return old
        return {
          ...old,
          tasks: old.tasks.map((t) =>
            idSet.has(t._id)
              ? {
                  ...t,
                  ...(status ? { status } : {}),
                  ...(assignedTo !== undefined ? { assignedTo: assignedToUser ?? null } : {}),
                }
              : t,
          ),
        }
      })
      return { snapshot }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) {
        for (const [key, data] of ctx.snapshot) {
          qc.setQueryData(key, data)
        }
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useBulkDeleteTasks() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await api.delete('/api/tasks/bulk', { data: { ids } })
      return ids
    },
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const snapshot = qc.getQueriesData<TasksResponse>({ queryKey: ['tasks'] })
      const idSet = new Set(ids)
      qc.setQueriesData<TasksResponse>({ queryKey: ['tasks'] }, (old) => {
        if (!old?.tasks) return old
        return {
          ...old,
          tasks: old.tasks.filter((t) => !idSet.has(t._id)),
          pagination: { ...old.pagination, total: Math.max(0, old.pagination.total - idSet.size) },
        }
      })
      return { snapshot }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) {
        for (const [key, data] of ctx.snapshot) {
          qc.setQueryData(key, data)
        }
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['trash'] })
    },
  })
}

export function useRestoreTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/api/tasks/${id}/restore`)
      return data.task as Task
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['trash'] })
    },
  })
}

export interface TrashResponse {
  tasks: Task[]
}

export function useTrash() {
  return useQuery<TrashResponse>({
    queryKey: ['trash'],
    queryFn: async () => {
      const { data } = await api.get('/api/tasks/trash')
      return data
    },
  })
}

export function usePermanentlyDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/tasks/${id}/permanent`)
      return id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trash'] }),
  })
}

export function useMoveTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, rank }: { id: string; status: Task['status']; rank: string }) => {
      const { data } = await api.patch(`/api/tasks/${id}`, { status, rank })
      return data.task as Task
    },
    onMutate: async ({ id, status, rank }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const snapshot = qc.getQueriesData<TasksResponse>({ queryKey: ['tasks'] })
      qc.setQueriesData<TasksResponse>({ queryKey: ['tasks'] }, (old) => {
        if (!old?.tasks) return old
        return {
          ...old,
          tasks: old.tasks.map((t) => (t._id === id ? { ...t, status, rank } : t)),
        }
      })
      return { snapshot }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) {
        for (const [key, data] of ctx.snapshot) {
          qc.setQueryData(key, data)
        }
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export interface TaskStats {
  total: number
  overdue: number
  byStatus: Record<string, number>
  byPriority: Record<string, number>
}

export function useTaskStats() {
  return useQuery<TaskStats>({
    queryKey: ['tasks', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/api/tasks/stats')
      return data
    },
  })
}
