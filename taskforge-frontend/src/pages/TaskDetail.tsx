import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, CalendarDays, User, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks'
import { useAuth } from '@/context/AuthContext'
import type { TaskInput } from '@/lib/schemas'
import StatusBadge from '@/components/StatusBadge'
import PriorityBadge from '@/components/PriorityBadge'
import TaskForm from '@/components/TaskForm'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function toDateInput(iso: string | undefined) {
  if (!iso) return ''
  return iso.slice(0, 10)
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
  const [editOpen, setEditOpen] = useState(false)

  const { data: task, isLoading, isError } = useTask(id!)
  const update = useUpdateTask(id!)
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

  const defaultFormValues: Partial<TaskInput> = {
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    status: task.status,
    dueDate: toDateInput(task.dueDate),
    assignedTo: task.assignedTo?._id ?? '',
  }

  async function handleEdit(values: TaskInput) {
    const body: Partial<TaskInput> = canManage
      ? {
          ...values,
          assignedTo:
            values.assignedTo === '_none' || values.assignedTo === ''
              ? undefined
              : values.assignedTo,
          dueDate: values.dueDate || undefined,
        }
      : { status: values.status }

    try {
      await update.mutateAsync(body)
      toast.success('Task updated')
      setEditOpen(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Failed to update task')
    }
  }

  async function handleDelete() {
    try {
      await remove.mutateAsync(id!)
      toast.success('Task deleted')
      navigate('/tasks')
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
        <Button variant="ghost" size="sm" asChild>
          <Link to="/tasks">
            <ArrowLeft className="size-4" />
            Tasks
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="grid gap-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold leading-snug">{task.title}</h1>
          <div className="flex shrink-0 items-center gap-2">
            {(canManage || isAssignee) && (
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md" onPointerDown={(e) => e.stopPropagation()}>
                  <DialogHeader>
                    <DialogTitle>Edit task</DialogTitle>
                  </DialogHeader>
                  <TaskForm
                    defaultValues={defaultFormValues}
                    onSubmit={handleEdit}
                    submitLabel="Save changes"
                    statusOnly={!canManage}
                  />
                </DialogContent>
              </Dialog>
            )}
            {canManage && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete task?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The task will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-white hover:bg-destructive/90"
                      onClick={handleDelete}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
    </div>
  )
}
