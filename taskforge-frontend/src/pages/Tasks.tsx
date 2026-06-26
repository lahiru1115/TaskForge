import { useState, useCallback } from 'react'
import { ClipboardList, LayoutGrid, Table2 } from 'lucide-react'
import { useTasks, type TaskFilters } from '@/hooks/useTasks'
import FilterBar from '@/components/FilterBar'
import TaskCard from '@/components/TaskCard'
import TaskTable from '@/components/TaskTable'
import CreateTaskDialog from '@/components/CreateTaskDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type ViewMode = 'table' | 'card'

const DEFAULT_FILTERS: TaskFilters = {
  search: '',
  status: '',
  priority: '',
  assignedTo: '',
  sort: '-createdAt',
}

export default function TasksPage() {
  const [view, setView] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('taskview-mode')
    return (saved as ViewMode) || 'table'
  })
  const [filters, setFilters] = useState<TaskFilters>({ ...DEFAULT_FILTERS, page: 1, limit: 10 })

  // Persist view mode to localStorage
  const handleViewChange = (newView: ViewMode) => {
    setView(newView)
    localStorage.setItem('taskview-mode', newView)
  }

  // Reset to page 1 when filters change (excluding page/limit)
  const handleFilterChange = useCallback((newFilters: TaskFilters) => {
    setFilters({ ...newFilters, page: 1, limit: view === 'table' ? 10 : 9 })
  }, [view])

  const { data: response, isLoading, isError } = useTasks(filters)
  const tasks = response?.tasks ?? []
  const pagination = response?.pagination

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn('rounded-r-none border-r', view === 'table' && 'bg-accent')}
              onClick={() => handleViewChange('table')}
              aria-label="Table view"
            >
              <Table2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn('rounded-l-none', view === 'card' && 'bg-accent')}
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
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load tasks. Check your connection and try refreshing.
        </div>
      )}

      {!isLoading && !isError && tasks && tasks.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <ClipboardList className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No tasks found.{' '}
            <span className="text-foreground">Create one to get started.</span>
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
            <div className="flex items-center justify-center gap-1 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, page: Math.max(1, (filters.page ?? 1) - 1) })}
                disabled={!pagination || pagination.page === 1}
              >
                Previous
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(3, pagination.pages) }).map((_, i) => {
                  const pageNum = pagination.page <= 2 ? i + 1 : pagination.page + i - 1
                  if (pageNum > pagination.pages) return null
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilters({ ...filters, page: pageNum })}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, page: Math.min(pagination.pages, (filters.page ?? 1) + 1) })}
                disabled={!pagination || pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
