import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface UserOption {
  _id: string
  name: string
  email: string
  role: string
}

export function useUsers() {
  return useQuery<UserOption[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/api/users')
      return data.users
    },
  })
}
