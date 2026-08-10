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

export function useTasks(slug: string, filters: TaskFilters = {}) {
  return useQuery<TasksResponse>({
    queryKey: ['ws', slug, 'tasks', filters],
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined),
      )
      const { data } = await api.get(`/api/workspaces/${slug}/tasks`, { params })
      return data
    },
    enabled: !!slug,
  })
}

export function useTask(slug: string, id: string) {
  return useQuery<Task>({
    queryKey: ['ws', slug, 'tasks', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/workspaces/${slug}/tasks/${id}`)
      return data.task
    },
    enabled: !!slug && !!id,
  })
}

export function useCreateTask(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: TaskInput) => {
      const { data } = await api.post(`/api/workspaces/${slug}/tasks`, body)
      return data.task as Task
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ws', slug, 'tasks'] }),
  })
}

export function useUpdateTask(slug: string, id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<TaskInput>) => {
      const { data } = await api.patch(`/api/workspaces/${slug}/tasks/${id}`, body)
      return data.task as Task
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ws', slug, 'tasks'] })
      qc.invalidateQueries({ queryKey: ['ws', slug, 'activity', id] })
    },
  })
}

export function useDeleteTask(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/workspaces/${slug}/tasks/${id}`)
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ws', slug, 'tasks'] })
      qc.invalidateQueries({ queryKey: ['ws', slug, 'trash'] })
    },
  })
}

export interface BulkUpdatePayload {
  ids: string[]
  status?: Task['status']
  assignedTo?: string | null
  /** Optimistic-only — the full user object to show immediately; not sent to the server. */
  assignedToUser?: TaskUser | null
}

export function useBulkUpdateTasks(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ assignedToUser: _assignedToUser, ...body }: BulkUpdatePayload) => {
      const { data } = await api.patch(`/api/workspaces/${slug}/tasks/bulk`, body)
      return data.tasks as Task[]
    },
    onMutate: async ({ ids, status, assignedTo, assignedToUser }) => {
      await qc.cancelQueries({ queryKey: ['ws', slug, 'tasks'] })
      const snapshot = qc.getQueriesData<TasksResponse>({ queryKey: ['ws', slug, 'tasks'] })
      const idSet = new Set(ids)
      qc.setQueriesData<TasksResponse>({ queryKey: ['ws', slug, 'tasks'] }, (old) => {
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
    onSettled: () => qc.invalidateQueries({ queryKey: ['ws', slug, 'tasks'] }),
  })
}

export function useBulkDeleteTasks(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await api.delete(`/api/workspaces/${slug}/tasks/bulk`, { data: { ids } })
      return ids
    },
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: ['ws', slug, 'tasks'] })
      const snapshot = qc.getQueriesData<TasksResponse>({ queryKey: ['ws', slug, 'tasks'] })
      const idSet = new Set(ids)
      qc.setQueriesData<TasksResponse>({ queryKey: ['ws', slug, 'tasks'] }, (old) => {
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
      qc.invalidateQueries({ queryKey: ['ws', slug, 'tasks'] })
      qc.invalidateQueries({ queryKey: ['ws', slug, 'trash'] })
    },
  })
}

export function useRestoreTask(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/api/workspaces/${slug}/tasks/${id}/restore`)
      return data.task as Task
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ws', slug, 'tasks'] })
      qc.invalidateQueries({ queryKey: ['ws', slug, 'trash'] })
    },
  })
}

export interface TrashResponse {
  tasks: Task[]
}

export function useTrash(slug: string) {
  return useQuery<TrashResponse>({
    queryKey: ['ws', slug, 'trash'],
    queryFn: async () => {
      const { data } = await api.get(`/api/workspaces/${slug}/tasks/trash`)
      return data
    },
    enabled: !!slug,
  })
}

export function usePermanentlyDeleteTask(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/workspaces/${slug}/tasks/${id}/permanent`)
      return id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ws', slug, 'trash'] }),
  })
}

export function useMoveTask(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, rank }: { id: string; status: Task['status']; rank: string }) => {
      const { data } = await api.patch(`/api/workspaces/${slug}/tasks/${id}`, { status, rank })
      return data.task as Task
    },
    onMutate: async ({ id, status, rank }) => {
      await qc.cancelQueries({ queryKey: ['ws', slug, 'tasks'] })
      const snapshot = qc.getQueriesData<TasksResponse>({ queryKey: ['ws', slug, 'tasks'] })
      qc.setQueriesData<TasksResponse>({ queryKey: ['ws', slug, 'tasks'] }, (old) => {
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
    onSettled: () => qc.invalidateQueries({ queryKey: ['ws', slug, 'tasks'] }),
  })
}

export interface TaskStats {
  total: number
  overdue: number
  byStatus: Record<string, number>
  byPriority: Record<string, number>
}

export function useTaskStats(slug: string) {
  return useQuery<TaskStats>({
    queryKey: ['ws', slug, 'tasks', 'stats'],
    queryFn: async () => {
      const { data } = await api.get(`/api/workspaces/${slug}/tasks/stats`)
      return data
    },
    enabled: !!slug,
  })
}
