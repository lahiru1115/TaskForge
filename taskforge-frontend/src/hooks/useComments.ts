import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export interface Comment {
  _id: string
  task: string
  author: string
  authorName: string
  body: string
  createdAt: string
  updatedAt: string
}

export function useTaskComments(slug: string, taskId: string) {
  return useQuery<Comment[]>({
    queryKey: ['ws', slug, 'comments', taskId],
    queryFn: async () => {
      const { data } = await api.get(`/api/workspaces/${slug}/tasks/${taskId}/comments`)
      return data.comments
    },
    enabled: !!slug && !!taskId,
  })
}

export function useAddComment(slug: string, taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: string) => {
      const { data } = await api.post(`/api/workspaces/${slug}/tasks/${taskId}/comments`, { body })
      return data.comment as Comment
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ws', slug, 'comments', taskId] }),
  })
}

export function useDeleteComment(slug: string, taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/api/workspaces/${slug}/tasks/${taskId}/comments/${commentId}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ws', slug, 'comments', taskId] }),
  })
}
