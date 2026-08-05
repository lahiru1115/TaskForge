import { useState } from 'react'
import { LayoutList, Search, X } from 'lucide-react'
import { useTasks, type TaskFilters } from '@/hooks/useTasks'
import { useMembers } from '@/hooks/useMembers'
import { useAuth } from '@/context/AuthContext'
import { useCurrentWorkspace } from '@/context/WorkspaceContext'
import KanbanBoard from '@/components/board/KanbanBoard'
import CreateTaskDialog from '@/components/task/CreateTaskDialog'
import { FilterSelect } from '@/components/task/FilterBar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const DEFAULT_FILTERS: TaskFilters = { search: '', priority: '', assignedTo: '' }

function hasActiveFilters(f: TaskFilters) {
  return (f.search ?? '') !== '' || (f.priority ?? '') !== '' || (f.assignedTo ?? '') !== ''
}

export default function BoardPage() {
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS)
  const { isAdmin } = useAuth()
  const { slug } = useCurrentWorkspace()
  const { data: membersData } = useMembers(slug, { limit: 100 })
  const users = (membersData?.members ?? []).map((m) => m.user)

  const { data: response, isLoading, isError } = useTasks(slug, { ...filters, limit: 500 })
  const tasks = response?.tasks ?? []

  function set(key: keyof TaskFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Board</h1>
        <CreateTaskDialog />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-45">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 pr-8"
            placeholder="Search tasks…"
            value={filters.search ?? ''}
            onChange={(e) => set('search', e.target.value)}
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => set('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <FilterSelect
          value={filters.priority}
          placeholder="Priority"
          options={PRIORITY_OPTIONS}
          onChange={(v) => set('priority', v)}
        />

        {isAdmin && (
          <FilterSelect
            value={filters.assignedTo}
            placeholder="Assignee"
            options={users.map((u) => ({ value: u._id, label: u.name }))}
            onChange={(v) => set('assignedTo', v)}
          />
        )}

        {hasActiveFilters(filters) && (
          <Button variant="ghost" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
            <X className="size-4" />
            Clear
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-68 flex-1 rounded-lg border border-t-4 border-t-muted p-3">
              <Skeleton className="mb-3 h-4 w-24" />
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="mb-2 h-20 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/15 px-4 py-3 text-sm text-destructive">
          Failed to load tasks. Check your connection and try refreshing.
        </div>
      )}

      {!isLoading && !isError && tasks.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <LayoutList className="size-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No tasks found.{' '}
            <span className="text-foreground font-medium">Create one to get started.</span>
          </p>
        </div>
      )}

      {!isLoading && !isError && tasks.length > 0 && (
        <KanbanBoard tasks={tasks} />
      )}
    </div>
  )
}
