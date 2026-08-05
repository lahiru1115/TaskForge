import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export type ActivityType =
  | 'created'
  | 'status_changed'
  | 'priority_changed'
  | 'assigned'
  | 'unassigned'
  | 'edited'

export interface Activity {
  _id: string
  task: string
  actor: string
  actorName: string
  type: ActivityType
  field?: string
  from?: string
  to?: string
  createdAt: string
}

export function useTaskActivity(slug: string, taskId: string) {
  return useQuery<Activity[]>({
    queryKey: ['ws', slug, 'activity', taskId],
    queryFn: async () => {
      const { data } = await api.get(`/api/workspaces/${slug}/tasks/${taskId}/activity`)
      return data.activities
    },
    enabled: !!slug && !!taskId,
  })
}
