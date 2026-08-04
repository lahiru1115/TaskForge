import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Loader2, XCircle, Mail } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useAcceptInvite } from '@/hooks/useMembers'
import { Button } from '@/components/ui/button'
import AppLogo from '@/components/shared/AppLogo'

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const acceptInvite = useAcceptInvite()
  const [error, setError] = useState<string | null>(null)
  const attempted = useRef(false)

  useEffect(() => {
    if (!user || !token || attempted.current) return
    attempted.current = true
    acceptInvite.mutate(token, {
      onSuccess: () => navigate('/workspaces', { replace: true }),
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setError(msg ?? 'This invite is invalid or has expired.')
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="grid w-full max-w-sm gap-5 text-center">
        <div className="flex items-center justify-center gap-2 font-semibold text-foreground">
          <AppLogo size={28} />
          TaskForge
        </div>

        {!user && (
          <div className="grid gap-4 rounded-lg border p-6">
            <Mail className="mx-auto size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">You've been invited to a workspace</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Log in or create an account with the invited email address to accept.
              </p>
            </div>
            <div className="grid gap-2">
              <Button asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/register">Create an account</Link>
              </Button>
            </div>
          </div>
        )}

        {user && !error && (
          <div className="grid gap-3 rounded-lg border p-6">
            <Loader2 className="mx-auto size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Accepting invite…</p>
          </div>
        )}

        {user && error && (
          <div className="grid gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-6">
            <XCircle className="mx-auto size-8 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Couldn't accept invite</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/workspaces">Go to your workspaces</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
