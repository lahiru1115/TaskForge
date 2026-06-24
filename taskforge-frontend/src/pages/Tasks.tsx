import { useState } from 'react'
import { LayoutGrid, Table2 } from 'lucide-react'
import { useTasks, type TaskFilters } from '@/hooks/useTasks'
import FilterBar from '@/components/FilterBar'
import TaskCard from '@/components/TaskCard'
import TaskTable from '@/components/TaskTable'
import CreateTaskDialog from '@/components/CreateTaskDialog'
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

export default function TasksPage() {
  const [view, setView] = useState<ViewMode>('table')
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS)

  const { data: tasks, isLoading, isError } = useTasks(filters)

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
              onClick={() => setView('table')}
              aria-label="Table view"
            >
              <Table2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn('rounded-l-none', view === 'card' && 'bg-accent')}
              onClick={() => setView('card')}
              aria-label="Card view"
            >
              <LayoutGrid className="size-4" />
            </Button>
          </div>
          <CreateTaskDialog />
        </div>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      {isLoading && (
        <div className="py-20 text-center text-muted-foreground">Loading tasks…</div>
      )}

      {isError && (
        <div className="py-20 text-center text-destructive">Failed to load tasks.</div>
      )}

      {!isLoading && !isError && tasks && tasks.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          No tasks found.{' '}
          <span className="text-foreground">Create one to get started.</span>
        </div>
      )}

      {!isLoading && !isError && tasks && tasks.length > 0 && (
        view === 'table' ? (
          <TaskTable tasks={tasks} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>
        )
      )}
    </div>
  )
}
