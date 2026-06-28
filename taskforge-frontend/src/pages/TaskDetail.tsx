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

function SidebarRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b last:border-0">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm text-foreground">{value}</div>
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
      <div className="mx-auto max-w-5xl grid gap-6">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-2/3" />
        <div className="grid gap-6 lg:grid-cols-[1fr_260px] items-start">
          <div className="grid gap-6">
            <Skeleton className="h-20 w-full" />
            <div className="grid gap-3">
              <Skeleton className="h-4 w-24" />
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
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
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

  const canManage = isAdmin || task.createdBy._id === user?._id
  const isAssignee = !canManage && task.assignedTo?._id === user?._id
  const isOverdue = task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date()

  async function handleDelete() {
    try {
      await remove.mutateAsync(id!)
      toast.success('Task deleted')
      navigate(-1)
    } catch {
      toast.error('Failed to delete task')
    }
  }

  return (
    <div className="mx-auto max-w-5xl grid gap-4">

      {/* Back */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </div>

      {/* Title + badges + actions */}
      <div className="grid gap-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold leading-snug">{task.title}</h1>
          <div className="flex shrink-0 items-center gap-2">
            {(canManage || isAssignee) && <EditTaskDialog task={task} canManage={canManage} />}
            {canManage && <DeleteTaskDialog onConfirm={handleDelete} />}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid gap-6 lg:grid-cols-[1fr_260px] items-start">

        {/* Main — description, activity, comments */}
        <div className="grid gap-6 min-w-0">
          {task.description ? (
            <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No description.</p>
          )}

          <div className="grid gap-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Activity</h2>
            <ActivityFeed taskId={id!} />
          </div>

          <div className="grid gap-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Comments</h2>
            <CommentSection taskId={id!} />
          </div>
        </div>

        {/* Sidebar — metadata + actions */}
        <div className="grid gap-3">
          {/* Metadata card */}
          <div className="rounded-lg border bg-card px-4">
            <SidebarRow
              icon={<User className="size-4" />}
              label="Created by"
              value={task.createdBy.name}
            />
            <SidebarRow
              icon={<User className="size-4" />}
              label="Assigned to"
              value={task.assignedTo?.name ?? <span className="text-muted-foreground">Unassigned</span>}
            />
            {task.dueDate && (
              <SidebarRow
                icon={<CalendarDays className="size-4" />}
                label="Due date"
                value={
                  <span className={isOverdue ? 'text-destructive font-medium' : undefined}>
                    {fmt(task.dueDate)}{isOverdue && ' · Overdue'}
                  </span>
                }
              />
            )}
            <SidebarRow
              icon={<Clock className="size-4" />}
              label="Created"
              value={fmt(task.createdAt)}
            />
            <SidebarRow
              icon={<Clock className="size-4" />}
              label="Updated"
              value={fmt(task.updatedAt)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
