import { useMemo, useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTasks, type Task } from '@/hooks/useTasks'
import { useCurrentWorkspace } from '@/context/WorkspaceContext'
import CreateTaskDialog from '@/components/task/CreateTaskDialog'
import DayOverflowDialog from '@/components/calendar/DayOverflowDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const STATUS_COLORS: Record<Task['status'], string> = {
  open:        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  testing:     'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
  done:        'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
}

const MAX_VISIBLE = 3

type DayState = { dateStr: string; tasks: Task[] } | null

export default function CalendarPage() {
  const { slug } = useCurrentWorkspace()
  const [displayMonth, setDisplayMonth] = useState(new Date())
  const [createDate, setCreateDate] = useState<string | null>(null)
  const [overflow, setOverflow] = useState<DayState>(null)
  const [activeStatuses, setActiveStatuses] = useState<Set<Task['status']>>(new Set())

  const { data: response, isLoading } = useTasks({ limit: 500 })
  const tasks = response?.tasks ?? []

  function toggleStatus(status: Task['status']) {
    setActiveStatuses((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }

  const dueDateMap = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of tasks) {
      if (!task.dueDate) continue
      if (activeStatuses.size > 0 && !activeStatuses.has(task.status)) continue
      const key = task.dueDate.slice(0, 10)
      map.set(key, [...(map.get(key) ?? []), task])
    }
    return map
  }, [tasks, activeStatuses])

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(displayMonth), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(displayMonth), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [displayMonth])

  const isFiltered = activeStatuses.size > 0

  return (
    <>
      <div className="grid gap-4">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" onClick={() => setDisplayMonth(subMonths(displayMonth, 1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <h1 className="text-xl font-semibold tracking-tight min-w-36 text-center">
              {format(displayMonth, 'MMMM yyyy')}
            </h1>
            <Button variant="outline" size="icon-sm" onClick={() => setDisplayMonth(addMonths(displayMonth, 1))}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDisplayMonth(new Date())}>
              Today
            </Button>
          </div>
          <CreateTaskDialog />
        </div>

        {/* Status legend / filter */}
        <div className="flex flex-wrap items-center gap-1">
          {(Object.entries(STATUS_COLORS) as [Task['status'], string][]).map(([status, cls]) => {
            const active = activeStatuses.has(status)
            const dimmed = isFiltered && !active
            return (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium border transition-all cursor-pointer',
                  active
                    ? 'border-foreground/40 bg-accent text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                  dimmed && 'opacity-40',
                )}
              >
                <span className={cn('inline-block w-2.5 h-2.5 rounded-sm shrink-0', cls)} />
                {status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            )
          })}
          {isFiltered && (
            <button
              onClick={() => setActiveStatuses(new Set())}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors ml-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Calendar grid */}
        {isLoading ? (
          <Skeleton className="h-150 w-full rounded-lg" />
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            {/* Day-of-week header */}
            <div className="grid grid-cols-7 border-b">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0"
                >
                  <span className="hidden sm:inline">{d}</span>
                  <span className="sm:hidden">{d[0]}</span>
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const dayTasks = dueDateMap.get(dateStr) ?? []
                const visible = dayTasks.slice(0, MAX_VISIBLE)
                const overflowCount = dayTasks.length - MAX_VISIBLE
                const inMonth = isSameMonth(day, displayMonth)
                const today = isToday(day)

                return (
                  <div
                    key={dateStr}
                    onClick={() => setCreateDate(dateStr)}
                    className={cn(
                      'min-h-24 sm:min-h-28 p-1 border-b border-r last-in-row:border-r-0 transition-colors cursor-pointer hover:bg-accent/30',
                      !inMonth && 'bg-muted/30',
                    )}
                  >
                    {/* Day number */}
                    <span
                      className={cn(
                        'w-7 h-7 mb-1 flex items-center justify-center rounded-full text-sm font-medium',
                        today && 'bg-primary text-primary-foreground',
                        !today && !inMonth && 'text-muted-foreground/50',
                        !today && inMonth && 'text-foreground',
                      )}
                    >
                      {format(day, 'd')}
                    </span>

                    {/* Task chips — desktop only */}
                    <div className="hidden sm:grid gap-0.5">
                      {visible.map((task) => (
                        <Link
                          key={task._id}
                          to={`/w/${slug}/tasks/${task._id}`}
                          title={task.title}
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            'block text-xs px-1.5 py-0.5 rounded truncate leading-tight hover:opacity-75 transition-opacity',
                            STATUS_COLORS[task.status],
                          )}
                        >
                          {task.title}
                        </Link>
                      ))}
                      {overflowCount > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setOverflow({ dateStr, tasks: dayTasks }) }}
                          className="text-xs text-muted-foreground px-1.5 leading-tight text-left hover:text-foreground hover:underline transition-colors cursor-pointer"
                        >
                          +{overflowCount} more
                        </button>
                      )}
                    </div>

                    {/* Mobile: dot indicators — tap to view tasks */}
                    {dayTasks.length > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setOverflow({ dateStr, tasks: dayTasks }) }}
                        className="sm:hidden flex flex-wrap gap-0.5 px-0.5 cursor-pointer"
                      >
                        {dayTasks.slice(0, 3).map((task) => (
                          <span
                            key={task._id}
                            className={cn('w-1.5 h-1.5 rounded-full', STATUS_COLORS[task.status])}
                          />
                        ))}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Day overflow dialog */}
      {overflow && (
        <DayOverflowDialog
          dateStr={overflow.dateStr}
          tasks={overflow.tasks}
          onClose={() => setOverflow(null)}
        />
      )}

      {/* Create task dialog */}
      <CreateTaskDialog
        open={createDate !== null}
        onOpenChange={(o) => { if (!o) setCreateDate(null) }}
        defaultDueDate={createDate ?? undefined}
      />
    </>
  )
}
