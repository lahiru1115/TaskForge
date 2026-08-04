import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { WorkspaceRole } from './useWorkspaces'

// Backend rejects 'owner' on both endpoints — no side door to ownership transfer.
type AssignableRole = Exclude<WorkspaceRole, 'owner'>

export interface Member {
  _id: string
  workspace: string
  user: { _id: string; name: string; email: string }
  role: WorkspaceRole
  status: 'active' | 'invited'
  createdAt: string
  updatedAt: string
}

export interface MembersResponse {
  members: Member[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export interface MembersParams {
  q?: string
  page?: number
  limit?: number
}

export function useMembers(slug: string | undefined, params: MembersParams = {}) {
  return useQuery<MembersResponse>({
    queryKey: ['ws', slug, 'members', params],
    queryFn: async () => {
      const { data } = await api.get(`/api/workspaces/${slug}/members`, { params })
      return data
    },
    enabled: !!slug,
  })
}

export function useUpdateMember(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AssignableRole }) => {
      const { data } = await api.patch(`/api/workspaces/${slug}/members/${userId}`, { role })
      return data.member as Member
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ws', slug, 'members'] }),
  })
}

export function useRemoveMember(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/api/workspaces/${slug}/members/${userId}`)
      return userId
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ws', slug, 'members'] }),
  })
}

export interface Invite {
  _id: string
  email: string
  role: WorkspaceRole
  expiresAt: string
}

export function useInvites(slug: string | undefined) {
  return useQuery<Invite[]>({
    queryKey: ['ws', slug, 'invites'],
    queryFn: async () => {
      const { data } = await api.get(`/api/workspaces/${slug}/invites`)
      return data.invites
    },
    enabled: !!slug,
  })
}

export interface CreateInviteInput {
  email: string
  role: AssignableRole
}

export function useCreateInvite(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateInviteInput) => {
      // Raw token is returned once here — only its hash is persisted server-side.
      const { data } = await api.post(`/api/workspaces/${slug}/invites`, body)
      return data as { invite: Invite; token: string }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ws', slug, 'invites'] }),
  })
}

export function useRevokeInvite(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (inviteId: string) => {
      await api.delete(`/api/workspaces/${slug}/invites/${inviteId}`)
      return inviteId
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ws', slug, 'invites'] }),
  })
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post(`/api/invites/${token}/accept`)
      return data as { workspaceId: string }
    },
  })
}
