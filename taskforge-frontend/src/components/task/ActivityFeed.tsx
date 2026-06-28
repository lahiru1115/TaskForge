import { GitCommitVertical, Plus, ArrowRight, Tag, User, Pencil } from 'lucide-react'
import { useTaskActivity, type Activity, type ActivityType } from '@/hooks/useActivity'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_COLORS: Record<string, string> = {
  open: 'text-slate-500',
  in_progress: 'text-blue-500',
  testing: 'text-violet-500',
  done: 'text-green-500',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  testing: 'Testing',
  done: 'Done',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-emerald-600',
  medium: 'text-amber-600',
  high: 'text-red-500',
}

function iconFor(type: ActivityType) {
  switch (type) {
    case 'created': return <Plus className="size-3.5" />
    case 'status_changed': return <ArrowRight className="size-3.5" />
    case 'priority_changed': return <Tag className="size-3.5" />
    case 'assigned':
    case 'unassigned': return <User className="size-3.5" />
    case 'edited': return <Pencil className="size-3.5" />
    default: return <GitCommitVertical className="size-3.5" />
  }
}

function iconBg(type: ActivityType) {
  switch (type) {
    case 'created': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
    case 'status_changed': return 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
    case 'priority_changed': return 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
    case 'assigned': return 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400'
    case 'unassigned': return 'bg-muted text-muted-foreground'
    case 'edited': return 'bg-muted text-muted-foreground'
  }
}

function ActivityDescription({ activity }: { activity: Activity }) {
  const { type, actorName, from, to, field } = activity

  switch (type) {
    case 'created':
      return (
        <span><span className="font-medium">{actorName}</span> created this task</span>
      )
    case 'status_changed':
      return (
        <span>
          <span className="font-medium">{actorName}</span> moved from{' '}
          <span className={cn('font-medium', STATUS_COLORS[from ?? ''])}>{STATUS_LABELS[from ?? ''] ?? from}</span>
          {' '}to{' '}
          <span className={cn('font-medium', STATUS_COLORS[to ?? ''])}>{STATUS_LABELS[to ?? ''] ?? to}</span>
        </span>
      )
    case 'priority_changed':
      return (
        <span>
          <span className="font-medium">{actorName}</span> changed priority from{' '}
          <span className={cn('font-medium capitalize', PRIORITY_COLORS[from ?? ''])}>{from}</span>
          {' '}to{' '}
          <span className={cn('font-medium capitalize', PRIORITY_COLORS[to ?? ''])}>{to}</span>
        </span>
      )
    case 'assigned':
      return (
        <span>
          <span className="font-medium">{actorName}</span> assigned to{' '}
          <span className="font-medium">{to}</span>
        </span>
      )
    case 'unassigned':
      return (
        <span><span className="font-medium">{actorName}</span> removed the assignee</span>
      )
    case 'edited':
      return (
        <span>
          <span className="font-medium">{actorName}</span> updated the{' '}
          <span className="font-medium">{field}</span>
        </span>
      )
  }
}

function ActivityItem({ activity, isLast }: { activity: Activity; isLast: boolean }) {
  return (
    <div className="flex gap-3">
      {/* Timeline spine + icon */}
      <div className="flex flex-col items-center">
        <div className={cn('flex size-6 shrink-0 items-center justify-center rounded-full', iconBg(activity.type))}>
          {iconFor(activity.type)}
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
      </div>

      {/* Content */}
      <div className={cn('min-w-0 pb-4 text-sm', isLast && 'pb-0')}>
        <ActivityDescription activity={activity} />
        <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(activity.createdAt)}</p>
      </div>
    </div>
  )
}

export default function ActivityFeed({ taskId }: { taskId: string }) {
  const { data: activities, isLoading } = useTaskActivity(taskId)

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-6 rounded-full shrink-0" />
            <div className="grid gap-1.5 flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!activities?.length) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>
  }

  return (
    <div>
      {activities.map((a, i) => (
        <ActivityItem key={a._id} activity={a} isLast={i === activities.length - 1} />
      ))}
    </div>
  )
}
