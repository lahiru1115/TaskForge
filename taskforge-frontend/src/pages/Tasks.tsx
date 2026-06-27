import { useState, useEffect } from 'react'
import { ClipboardList, LayoutGrid, Table2 } from 'lucide-react'
import { useTasks, type TaskFilters } from '@/hooks/useTasks'
import FilterBar from '@/components/task/FilterBar'
import TaskCard from '@/components/task/TaskCard'
import TaskTable from '@/components/task/TaskTable'
import TaskPagination from '@/components/task/TaskPagination'
import CreateTaskDialog from '@/components/task/CreateTaskDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ViewMode = 'table' | 'card'

const DEFAULT_FILTERS: TaskFilters = {
  search: '',
  status: '',
  priority: '',
  assignedTo: '',
  sort: '-createdAt',
}

const STORAGE_KEY = 'tf-tasks-state'

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return (parsed[key] as T) ?? fallback
  } catch {
    return fallback
  }
}

export default function TasksPage() {
  const [view, setView] = useState<ViewMode>(
    () => readStorage('view', (localStorage.getItem('taskview-mode') as ViewMode) ?? 'table'),
  )
  const [filters, setFilters] = useState<TaskFilters>(
    () => readStorage('filters', { ...DEFAULT_FILTERS, page: 1, limit: 10 }),
  )

  // Persist state to sessionStorage so navigating back restores page/filters
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ view, filters }))
  }, [view, filters])

  function handleViewChange(newView: ViewMode) {
    setView(newView)
    localStorage.setItem('taskview-mode', newView)
    setFilters((prev) => ({ ...prev, limit: newView === 'table' ? 10 : 9 }))
  }

  function handleFilterChange(newFilters: TaskFilters) {
    setFilters({ ...newFilters, page: 1, limit: view === 'table' ? 10 : 9 })
  }

  function handlePageChange(page: number) {
    setFilters((prev) => ({ ...prev, page }))
  }

  const { data: response, isLoading, isError } = useTasks(filters)
  const tasks = response?.tasks ?? []
  const pagination = response?.pagination

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border/50 bg-muted/30">
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn('rounded-r-none border-r border-border/30 transition-all', view === 'table' && 'bg-background shadow-sm')}
              onClick={() => handleViewChange('table')}
              aria-label="Table view"
            >
              <Table2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn('rounded-l-none transition-all', view === 'card' && 'bg-background shadow-sm')}
              onClick={() => handleViewChange('card')}
              aria-label="Card view"
            >
              <LayoutGrid className="size-4" />
            </Button>
          </div>
          <CreateTaskDialog />
        </div>
      </div>

      <FilterBar filters={filters} onChange={handleFilterChange} />

      {isLoading && (
        <div className="overflow-hidden rounded-lg border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-0">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/15 px-4 py-3 text-sm text-destructive">
          Failed to load tasks. Check your connection and try refreshing.
        </div>
      )}

      {!isLoading && !isError && tasks && tasks.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <ClipboardList className="size-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No tasks found.{' '}
            <span className="text-foreground font-medium">Create one to get started.</span>
          </p>
        </div>
      )}

      {!isLoading && !isError && tasks && tasks.length > 0 && (
        <>
          {view === 'table' ? (
            <TaskTable tasks={tasks} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task) => (
                <TaskCard key={task._id} task={task} />
              ))}
            </div>
          )}

          {pagination && pagination.pages > 1 && (
            <TaskPagination pagination={pagination} onPageChange={handlePageChange} />
          )}
        </>
      )}
    </div>
  )
}
