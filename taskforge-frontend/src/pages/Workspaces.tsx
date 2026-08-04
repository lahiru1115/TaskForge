import { Link } from 'react-router-dom'
import { Building2, Crown, Shield, User as UserIcon, Eye, LogOut } from 'lucide-react'
import { useWorkspaces, type WorkspaceRole } from '@/hooks/useWorkspaces'
import { useAuth } from '@/context/AuthContext'
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
  const { logout } = useAuth()
  const { data: memberships, isLoading, isError } = useWorkspaces()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <AppLogo size={24} />
            TaskForge
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="size-4" />
            Log out
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-3xl gap-6 px-4 py-10">
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
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        )}

        {!isLoading && !isError && memberships?.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
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
          <div className="grid gap-3 sm:grid-cols-2">
            {memberships.map(({ workspace, role }) => {
              const RoleIcon = ROLE_ICON[role]
              return (
                <Link key={workspace._id} to={`/w/${workspace.slug}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">{workspace.name}</CardTitle>
                        <Badge variant="secondary" className="shrink-0 gap-1 capitalize">
                          <RoleIcon className="size-3" />
                          {role}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">/w/{workspace.slug}</p>
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
