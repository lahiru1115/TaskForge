import { Link } from 'react-router-dom'
import { ArrowLeft, Building2, Crown, Shield, User as UserIcon, Eye, LogOut, Sun, Moon } from 'lucide-react'
import { useWorkspaces, type WorkspaceRole } from '@/hooks/useWorkspaces'
import { useAuth } from '@/context/AuthContext'
import { useDarkMode } from '@/hooks/useDarkMode'
import { LAST_WORKSPACE_KEY } from '@/components/layout/WorkspaceLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AppLogo from '@/components/shared/AppLogo'
import CreateWorkspaceDialog from '@/components/workspace/CreateWorkspaceDialog'

const ROLE_ICON: Record<WorkspaceRole, React.ElementType> = {
  owner: Crown,
  admin: Shield,
  member: UserIcon,
  viewer: Eye,
}

export default function WorkspacesPage() {
  const { user, logout } = useAuth()
  const { data: memberships, isLoading, isError } = useWorkspaces()
  const [dark, toggleDark] = useDarkMode()
  const lastSlug = localStorage.getItem(LAST_WORKSPACE_KEY)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <AppLogo size={24} />
            TaskForge
          </div>
          <div className="flex items-center gap-1">
            {user && (
              <span className="hidden pr-2 text-sm text-muted-foreground sm:inline">{user.name}</span>
            )}
            <Button variant="ghost" size="icon-sm" onClick={toggleDark} aria-label="Toggle theme">
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="size-4" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-4xl gap-4 px-4 py-10">
        {lastSlug && (
          <div>
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/w/${lastSlug}`}>
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your workspaces</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a workspace to continue, or create a new one.
            </p>
          </div>
          <CreateWorkspaceDialog />
        </div>

        {isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load workspaces. Check your connection and try refreshing.
          </div>
        )}

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && !isError && memberships?.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <Building2 className="size-10 text-muted-foreground/30" />
            <div>
              <p className="font-medium">No workspaces yet</p>
              <p className="text-sm text-muted-foreground">
                Create one to start tracking tasks with your team.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !isError && memberships && memberships.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {memberships.map(({ workspace, role }) => {
              const RoleIcon = ROLE_ICON[role]
              return (
                <Link key={workspace._id} to={`/w/${workspace.slug}`}>
                  <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Building2 className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="truncate text-base">{workspace.workspaceName}</CardTitle>
                          <p className="truncate text-xs text-muted-foreground">/w/{workspace.slug}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                      <p className="truncate text-sm text-muted-foreground">{workspace.organizationName}</p>
                      <Badge variant="secondary" className="w-fit gap-1 capitalize">
                        <RoleIcon className="size-3" />
                        {role}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
