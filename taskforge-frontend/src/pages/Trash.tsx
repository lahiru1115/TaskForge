import { Trash2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useTrash, useRestoreTask, usePermanentlyDeleteTask } from '@/hooks/useTasks'
import { useAuth } from '@/context/AuthContext'
import { useCurrentWorkspace } from '@/context/WorkspaceContext'
import StatusBadge from '@/components/shared/StatusBadge'
import PriorityBadge from '@/components/shared/PriorityBadge'
import PermanentDeleteDialog from '@/components/task/PermanentDeleteDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

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

export default function TrashPage() {
  const { user } = useAuth()
  const { slug } = useCurrentWorkspace()
  const { data, isLoading, isError } = useTrash(slug)
  const restore = useRestoreTask(slug)
  const permanentlyDelete = usePermanentlyDeleteTask(slug)

  const tasks = data?.tasks ?? []

  function handleRestore(id: string, title: string) {
    restore.mutate(id, {
      onSuccess: () => toast.success(`"${title}" restored`),
      onError: () => toast.error('Failed to restore task'),
    })
  }

  function handlePermanentDelete(id: string, title: string) {
    permanentlyDelete.mutate(id, {
      onSuccess: () => toast.success(`"${title}" permanently deleted`),
      onError: () => toast.error('Failed to delete task'),
    })
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trash</h1>
        <p className="text-sm text-muted-foreground">
          Deleted tasks stay here until you restore them or delete them for good.
        </p>
      </div>

      {isLoading && (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border px-4 py-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/15 px-4 py-3 text-sm text-destructive">
          Failed to load trash. Check your connection and try refreshing.
        </div>
      )}

      {!isLoading && !isError && tasks.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Trash2 className="size-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Trash is empty.</p>
        </div>
      )}

      {!isLoading && !isError && tasks.length > 0 && (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 grid gap-1.5">
                <p className="truncate font-medium">{task.title}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  <span className="text-xs text-muted-foreground">
                    Deleted {timeAgo(task.deletedAt!)}
                    {task.createdBy._id !== user?._id && ` · by ${task.createdBy.name}`}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(task._id, task.title)}
                >
                  <RotateCcw className="size-4" />
                  Restore
                </Button>
                <PermanentDeleteDialog
                  taskTitle={task.title}
                  onConfirm={() => handlePermanentDelete(task._id, task.title)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
