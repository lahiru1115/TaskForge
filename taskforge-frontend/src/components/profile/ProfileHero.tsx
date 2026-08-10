import { Shield } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

interface ProfileHeroProps {
  memberSince: string | undefined
  loading: boolean
}

export default function ProfileHero({ memberSince, loading }: ProfileHeroProps) {
  const { user, isPlatformAdmin } = useAuth()

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="h-20 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
      <CardContent className="relative px-6 pt-0 pb-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="-mt-10 flex size-20 shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-primary text-2xl font-bold text-primary-foreground shadow-md select-none">
              {user ? initials(user.name) : null}
            </div>
            <div className="pb-1">
              <p className="text-xl font-semibold leading-tight">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pb-1">
            {isPlatformAdmin && (
              <Badge className="gap-1">
                <Shield className="size-3" />
                Platform admin
              </Badge>
            )}
            {loading ? (
              <Skeleton className="h-5 w-32 rounded-full" />
            ) : (
              memberSince && <Badge variant="secondary">Member since {fmt(memberSince)}</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
