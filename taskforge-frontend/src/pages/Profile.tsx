import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import ProfileAvatar from '@/components/ProfileAvatar'
import ProfileDetails from '@/components/ProfileDetails'
import ProfilePassword from '@/components/ProfilePassword'

interface MeResponse {
  _id: string
  name: string
  email: string
  role: 'admin' | 'user'
  createdAt: string
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const queryClient = useQueryClient()

  const { data: me, isLoading } = useQuery<MeResponse>({
    queryKey: ['me'],
    queryFn: () => api.get('/api/auth/me').then((r) => r.data.user),
  })

  function handleUserUpdated(name: string, email: string) {
    updateUser({ ...user!, name, email })
    queryClient.setQueryData(['me'], (old: MeResponse) => ({ ...old, name, email }))
  }

  return (
    <div className="mx-auto max-w-lg grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Your account details.</p>
      </div>

      <ProfileAvatar />
      <ProfileDetails
        memberSince={me?.createdAt}
        loading={isLoading}
        onUserUpdated={handleUserUpdated}
      />
      <ProfilePassword />
    </div>
  )
}
