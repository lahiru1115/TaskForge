import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, CalendarDays, User, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useTask, useDeleteTask } from '@/hooks/useTasks'
import { useAuth } from '@/context/AuthContext'
import StatusBadge from '@/components/shared/StatusBadge'
import PriorityBadge from '@/components/shared/PriorityBadge'
import EditTaskDialog from '@/components/task/EditTaskDialog'
import DeleteTaskDialog from '@/components/task/DeleteTaskDialog'
import ActivityFeed from '@/components/task/ActivityFeed'
import CommentSection from '@/components/task/CommentSection'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  )
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()

  const { data: task, isLoading, isError } = useTask(id!)
  const remove = useDeleteTask()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl grid gap-6">
        <Skeleton className="h-8 w-20" />
        <div className="grid gap-3">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !task) {
    return (
      <div className="py-20 text-center">
        <p className="text-destructive">Task not found.</p>
        <Link to="/tasks" className="mt-2 inline-block text-sm text-primary underline underline-offset-4">
          Back to tasks
        </Link>
      </div>
    )
  }

  const canManage =
    isAdmin || task.createdBy._id === user?._id
  const isAssignee =
    !canManage && task.assignedTo?._id === user?._id

  async function handleDelete() {
    try {
      await remove.mutateAsync(id!)
      toast.success('Task deleted')
      navigate(-1)
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const isOverdue =
    task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date()

  return (
    <div className="mx-auto max-w-2xl grid gap-6">
      {/* Back */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </div>

      {/* Header */}
      <div className="grid gap-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold leading-snug">{task.title}</h1>
          <div className="flex shrink-0 items-center gap-2">
            {(canManage || isAssignee) && (
              <EditTaskDialog task={task} canManage={canManage} />
            )}
            {canManage && (
              <DeleteTaskDialog onConfirm={handleDelete} />
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
      )}

      {/* Metadata */}
      <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
        {task.dueDate && (
          <MetaRow
            icon={<CalendarDays className="size-4" />}
            label="Due date"
            value={
              <span className={isOverdue ? 'text-destructive font-medium' : undefined}>
                {fmt(task.dueDate)}
                {isOverdue && ' · Overdue'}
              </span>
            }
          />
        )}
        <MetaRow
          icon={<User className="size-4" />}
          label="Created by"
          value={task.createdBy.name}
        />
        <MetaRow
          icon={<User className="size-4" />}
          label="Assigned to"
          value={task.assignedTo?.name ?? 'Unassigned'}
        />
        <MetaRow
          icon={<Clock className="size-4" />}
          label="Created"
          value={fmt(task.createdAt)}
        />
        <MetaRow
          icon={<Clock className="size-4" />}
          label="Last updated"
          value={fmt(task.updatedAt)}
        />
      </div>

      {/* Activity */}
      <div className="grid gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Activity</h2>
        <ActivityFeed taskId={id!} />
      </div>

      {/* Comments */}
      <div className="grid gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Comments</h2>
        <CommentSection taskId={id!} />
      </div>
    </div>
  )
}
