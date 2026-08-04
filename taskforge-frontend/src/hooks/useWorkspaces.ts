import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { CreateWorkspaceInput } from '@/lib/schemas'

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface Workspace {
  _id: string
  name: string
  slug: string
  owner: string
  createdAt: string
  updatedAt: string
}

export interface WorkspaceMembership {
  workspace: Workspace
  role: WorkspaceRole
}

export function useWorkspaces() {
  return useQuery<WorkspaceMembership[]>({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data } = await api.get('/api/workspaces')
      return data.workspaces
    },
  })
}

export function useWorkspace(slug: string | undefined) {
  return useQuery<{ workspace: Workspace; role: WorkspaceRole }>({
    queryKey: ['ws', slug],
    queryFn: async () => {
      const { data } = await api.get(`/api/workspaces/${slug}`)
      return data
    },
    enabled: !!slug,
  })
}

export function useCreateWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateWorkspaceInput) => {
      const { data } = await api.post('/api/workspaces', body)
      return data.workspace as Workspace
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}

export function useUpdateWorkspace(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string }) => {
      const { data } = await api.patch(`/api/workspaces/${slug}`, body)
      return data.workspace as Workspace
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces'] })
      qc.invalidateQueries({ queryKey: ['ws', slug] })
    },
  })
}

export function useDeleteWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (slug: string) => {
      await api.delete(`/api/workspaces/${slug}`)
      return slug
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}
