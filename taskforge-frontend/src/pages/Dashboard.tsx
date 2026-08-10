import { Link, useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  Circle,
  Clock,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  ArrowDown,
  Minus,
  ArrowUp,
  ArrowRight,
} from 'lucide-react'
import { useTaskStats, type TaskFilters } from '@/hooks/useTasks'
import { useAuth } from '@/context/AuthContext'
import { useCurrentWorkspace } from '@/context/WorkspaceContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

const TASKS_STORAGE_KEY = 'tf-tasks-state'
const BASE_FILTERS: TaskFilters = {
  search: '',
  status: '',
  priority: '',
  assignedTo: '',
  sort: '-createdAt',
  page: 1,
  limit: 10,
}

interface StatCardProps {
  label: string
  value: number | undefined
  icon: React.ElementType
  color: string
  accent: string
  blob: string
  loading: boolean
  filter?: Partial<TaskFilters>
}

function StatCard({ label, value, icon: Icon, color, accent, blob, loading, filter }: StatCardProps) {
  const navigate = useNavigate()
  const { slug } = useCurrentWorkspace()

  function handleClick() {
    sessionStorage.setItem(
      TASKS_STORAGE_KEY,
      JSON.stringify({ view: 'table', filters: { ...BASE_FILTERS, ...filter } }),
    )
    navigate(`/w/${slug}/tasks`)
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden gap-3 py-5 border-t-2 hover:shadow-md transition-all duration-200',
        accent,
        filter !== undefined && 'cursor-pointer',
      )}
      onClick={filter !== undefined ? handleClick : undefined}
      role={filter !== undefined ? 'button' : undefined}
      tabIndex={filter !== undefined ? 0 : undefined}
      onKeyDown={
        filter !== undefined
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') handleClick()
            }
          : undefined
      }
    >
      {/* Corner blob */}
      <div className={cn('pointer-events-none absolute -bottom-6 -right-6 size-28 rounded-full blur-xl', blob)} />

      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <span className={cn('rounded-md p-1.5 ring-1 ring-current/20', color)}>
            <Icon className="size-4" />
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-12 animate-pulse rounded bg-muted" />
        ) : (
          <p className="text-3xl font-bold tracking-tight">{value ?? 0}</p>
        )}
      </CardContent>
    </Card>
  )
}

const STATUS_CARDS = [
  {
    key: 'open',
    label: 'Open',
    icon: Circle,
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    accent: 'border-t-slate-400',
    blob: 'bg-slate-400/15',
    filter: { status: 'open' } as Partial<TaskFilters>,
  },
  {
    key: 'in_progress',
    label: 'In Progress',
    icon: Clock,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
    accent: 'border-t-blue-500',
    blob: 'bg-blue-400/15',
    filter: { status: 'in_progress' } as Partial<TaskFilters>,
  },
  {
    key: 'testing',
    label: 'Testing',
    icon: FlaskConical,
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300',
    accent: 'border-t-violet-500',
    blob: 'bg-violet-400/15',
    filter: { status: 'testing' } as Partial<TaskFilters>,
  },
  {
    key: 'done',
    label: 'Done',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300',
    accent: 'border-t-green-500',
    blob: 'bg-green-400/15',
    filter: { status: 'done' } as Partial<TaskFilters>,
  },
]

const PRIORITY_CARDS = [
  {
    key: 'low',
    label: 'Low Priority',
    icon: ArrowDown,
    color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    accent: 'border-t-gray-400',
    blob: 'bg-gray-400/15',
    filter: { priority: 'low' } as Partial<TaskFilters>,
  },
  {
    key: 'medium',
    label: 'Medium Priority',
    icon: Minus,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
    accent: 'border-t-amber-500',
    blob: 'bg-amber-400/15',
    filter: { priority: 'medium' } as Partial<TaskFilters>,
  },
  {
    key: 'high',
    label: 'High Priority',
    icon: ArrowUp,
    color: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
    accent: 'border-t-red-500',
    blob: 'bg-red-400/15',
    filter: { priority: 'high' } as Partial<TaskFilters>,
  },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const { slug } = useCurrentWorkspace()
  const { data: stats, isLoading, isError } = useTaskStats(slug)

  return (
    <div className="mx-auto grid max-w-6xl gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {user?.name ?? 'there'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's an overview of your tasks.
          </p>
        </div>
        <Button asChild>
          <Link to={`/w/${slug}/tasks`}>
            View all tasks <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load stats. Check your connection and try refreshing.
        </div>
      )}

      {/* Summary row */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Total Tasks"
            value={stats?.total}
            icon={ClipboardList}
            color="bg-primary/10 text-primary"
            accent="border-t-primary"
            blob="bg-primary/10"
            loading={isLoading}
            filter={{}}
          />
          <StatCard
            label="Overdue"
            value={stats?.overdue}
            icon={AlertTriangle}
            color="bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300"
            accent="border-t-rose-500"
            blob="bg-rose-400/15"
            loading={isLoading}
            filter={{ sort: 'dueDate' }}
          />
        </div>

        {/* Completion progress bar */}
        <div className="mt-4 rounded-lg border bg-card px-5 py-4">
          {isLoading ? (
            <div className="grid gap-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
            </div>
          ) : (() => {
            const done = stats?.byStatus?.done ?? 0
            const total = stats?.total ?? 0
            const pct = total > 0 ? Math.round((done / total) * 100) : 0
            return (
              <div className="grid gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {done} of {total} tasks completed
                  </span>
                  <span className="text-muted-foreground">{pct}%</span>
                </div>
                <Progress value={pct} />
              </div>
            )
          })()}
        </div>
      </section>

      {/* By status */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          By Status
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATUS_CARDS.map(({ key, label, icon, color, accent, blob, filter }) => (
            <StatCard
              key={key}
              label={label}
              value={stats?.byStatus[key]}
              icon={icon}
              color={color}
              accent={accent}
              blob={blob}
              loading={isLoading}
              filter={filter}
            />
          ))}
        </div>
      </section>

      {/* By priority */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          By Priority
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {PRIORITY_CARDS.map(({ key, label, icon, color, accent, blob, filter }) => (
            <StatCard
              key={key}
              label={label}
              value={stats?.byPriority[key]}
              icon={icon}
              color={color}
              accent={accent}
              blob={blob}
              loading={isLoading}
              filter={filter}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
