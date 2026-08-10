import { useEffect } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Building2, Loader2 } from 'lucide-react'
import { WorkspaceProvider, useCurrentWorkspace } from '@/context/WorkspaceContext'
import { LAST_WORKSPACE_KEY } from '@/lib/storage'
import { Button } from '@/components/ui/button'

function WorkspaceGate() {
  const { slug, workspace, isLoading, isError } = useCurrentWorkspace()

  useEffect(() => {
    if (workspace) localStorage.setItem(LAST_WORKSPACE_KEY, slug)
  }, [workspace, slug])

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading workspace…</p>
      </div>
    )
  }

  if (isError || !workspace) {
    // Same 404 treatment the backend uses for non-members — never distinguish
    // "doesn't exist" from "you're not in it", so workspace existence isn't leaked.
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Building2 className="size-10 text-muted-foreground/30" />
        <div>
          <p className="font-medium">Workspace not found</p>
          <p className="text-sm text-muted-foreground">It doesn't exist, or you're not a member.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/workspaces">Back to your workspaces</Link>
        </Button>
      </div>
    )
  }

  return <Outlet />
}

export default function WorkspaceLayout() {
  return (
    <WorkspaceProvider>
      <WorkspaceGate />
    </WorkspaceProvider>
  )
}
