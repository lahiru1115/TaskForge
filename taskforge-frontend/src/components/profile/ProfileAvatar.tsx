import { User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function ProfileAvatar() {
  const { user, isPlatformAdmin } = useAuth()

  return (
    <Card>
      <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
        <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold select-none">
          {user ? initials(user.name) : <User className="size-8" />}
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold">{user?.name}</p>
          {isPlatformAdmin && (
            <span className="mt-1 inline-block rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
              Admin
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
