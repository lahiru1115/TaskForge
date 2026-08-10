import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import ProfileHero from '@/components/profile/ProfileHero'
import ProfileDetails from '@/components/profile/ProfileDetails'
import ProfilePassword from '@/components/profile/ProfilePassword'

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
    <div className="mx-auto grid max-w-4xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account information and security.</p>
      </div>

      <ProfileHero memberSince={me?.createdAt} loading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileDetails onUserUpdated={handleUserUpdated} />
        <ProfilePassword />
      </div>
    </div>
  )
}
