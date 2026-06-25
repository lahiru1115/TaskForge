import { Link } from 'react-router-dom'
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
import { useTaskStats } from '@/hooks/useTasks'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number | undefined
  icon: React.ElementType
  color: string
  loading: boolean
}

function StatCard({ label, value, icon: Icon, color, loading }: StatCardProps) {
  return (
    <Card className="gap-3 py-5">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <span className={cn('rounded-md p-1.5', color)}>
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
  },
  {
    key: 'in_progress',
    label: 'In Progress',
    icon: Clock,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
  },
  {
    key: 'testing',
    label: 'Testing',
    icon: FlaskConical,
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300',
  },
  {
    key: 'done',
    label: 'Done',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300',
  },
]

const PRIORITY_CARDS = [
  {
    key: 'low',
    label: 'Low Priority',
    icon: ArrowDown,
    color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  },
  {
    key: 'medium',
    label: 'Medium Priority',
    icon: Minus,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
  },
  {
    key: 'high',
    label: 'High Priority',
    icon: ArrowUp,
    color: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
  },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: stats, isLoading, isError } = useTaskStats()

  return (
    <div className="grid gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {user?.name ?? 'there'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's an overview of your tasks.
          </p>
        </div>
        <Button asChild>
          <Link to="/tasks">
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
            loading={isLoading}
          />
          <StatCard
            label="Overdue"
            value={stats?.overdue}
            icon={AlertTriangle}
            color="bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300"
            loading={isLoading}
          />
        </div>
      </section>

      {/* By status */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          By Status
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATUS_CARDS.map(({ key, label, icon, color }) => (
            <StatCard
              key={key}
              label={label}
              value={stats?.byStatus[key]}
              icon={icon}
              color={color}
              loading={isLoading}
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
          {PRIORITY_CARDS.map(({ key, label, icon, color }) => (
            <StatCard
              key={key}
              label={label}
              value={stats?.byPriority[key]}
              icon={icon}
              color={color}
              loading={isLoading}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
