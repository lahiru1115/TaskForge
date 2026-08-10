import { Fragment } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useCurrentWorkspace } from '@/context/WorkspaceContext'
import { useTask } from '@/hooks/useTasks'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { OPEN_COMMAND_PALETTE_EVENT } from '@/components/shared/CommandPalette'

// Static top-level routes, relative to the workspace root — matches App.tsx and AppSidebar's NAV_ITEMS.
const PAGE_LABELS: Record<string, string> = {
  '': 'Dashboard',
  tasks: 'Tasks',
  board: 'Board',
  calendar: 'Calendar',
  trash: 'Trash',
  profile: 'Profile',
  'settings/members': 'Members',
}

interface Crumb {
  label: string
  to?: string
  loading?: boolean
}

function useBreadcrumbs(): Crumb[] {
  const { slug } = useCurrentWorkspace()
  const location = useLocation()
  const { id } = useParams<{ id?: string }>()
  const { data: task, isLoading } = useTask(slug, id ?? '')

  const rel = location.pathname.replace(new RegExp(`^/w/${slug}/?`), '')

  if (id) {
    // Task detail has no nav item of its own — link back to whichever tab
    // the user arrived from (Tasks/Board/Calendar), same as the sidebar's
    // own active-tab highlighting.
    const referrer = (location.state as { from?: string } | null)?.from
    const parentPath = referrer ?? `/w/${slug}/tasks`
    const parentLabel = parentPath.endsWith('/board')
      ? 'Board'
      : parentPath.endsWith('/calendar')
        ? 'Calendar'
        : 'Tasks'
    return [
      { label: parentLabel, to: parentPath },
      { label: task?.title ?? 'Task', loading: isLoading },
    ]
  }

  return [{ label: PAGE_LABELS[rel] ?? 'Dashboard' }]
}

export default function SiteHeader() {
  const crumbs = useBreadcrumbs()

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, i) => (
            <Fragment key={crumb.label}>
              <BreadcrumbItem>
                {crumb.to ? (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.to}>{crumb.label}</Link>
                  </BreadcrumbLink>
                ) : crumb.loading ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {i < crumbs.length - 1 && <BreadcrumbSeparator />}
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <Button
        variant="outline"
        size="sm"
        className="ml-auto flex w-64 items-center justify-between gap-2 text-muted-foreground"
        onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT))}
      >
        <span className="flex items-center gap-2">
          <Search className="size-3.5" />
          Search
        </span>
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
      </Button>
    </header>
  )
}
