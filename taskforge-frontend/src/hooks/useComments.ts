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

export function useTaskComments(taskId: string) {
  return useQuery<Comment[]>({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      const { data } = await api.get(`/api/tasks/${taskId}/comments`)
      return data.comments
    },
    enabled: !!taskId,
  })
}

export function useAddComment(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: string) => {
      const { data } = await api.post(`/api/tasks/${taskId}/comments`, { body })
      return data.comment as Comment
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', taskId] }),
  })
}

export function useDeleteComment(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/api/tasks/${taskId}/comments/${commentId}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', taskId] }),
  })
}
