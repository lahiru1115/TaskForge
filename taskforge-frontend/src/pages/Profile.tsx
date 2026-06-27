import { useQuery } from '@tanstack/react-query'
import { User, Mail, ShieldCheck, Calendar } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

interface MeResponse {
  _id: string
  name: string
  email: string
  role: 'admin' | 'user'
  createdAt: string
}

export default function ProfilePage() {
  const { user, isAdmin } = useAuth()

  const { data: me, isLoading } = useQuery<MeResponse>({
    queryKey: ['me'],
    queryFn: () => api.get('/api/auth/me').then((r) => r.data.user),
  })

  return (
    <div className="mx-auto max-w-lg grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Your account details.</p>
      </div>

      <Card>
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
          {/* Avatar */}
          <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold select-none">
            {user ? initials(user.name) : <User className="size-8" />}
          </div>

          <div className="text-center">
            <p className="text-xl font-semibold">{user?.name}</p>
            {isAdmin && (
              <span className="mt-1 inline-block rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                Admin
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 pb-6 grid gap-5">
          <InfoRow
            icon={<User className="size-4" />}
            label="Full name"
            value={user?.name}
            loading={false}
          />
          <InfoRow
            icon={<Mail className="size-4" />}
            label="Email"
            value={user?.email}
            loading={false}
          />
          <InfoRow
            icon={<ShieldCheck className="size-4" />}
            label="Role"
            value={isAdmin ? 'Administrator' : 'Member'}
            loading={false}
          />
          <InfoRow
            icon={<Calendar className="size-4" />}
            label="Member since"
            value={me?.createdAt ? fmt(me.createdAt) : undefined}
            loading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode
  label: string
  value: string | undefined
  loading: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-1 h-4 w-32" />
        ) : (
          <p className="text-sm text-foreground truncate">{value ?? '—'}</p>
        )}
      </div>
    </div>
  )
}
