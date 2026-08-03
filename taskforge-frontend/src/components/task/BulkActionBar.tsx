import { X, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { useAuth } from '@/context/AuthContext'
import { useUsers } from '@/hooks/useUsers'
import { useBulkUpdateTasks, useBulkDeleteTasks, useRestoreTask } from '@/hooks/useTasks'
import type { Task } from '@/hooks/useTasks'

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'testing', label: 'Testing' },
  { value: 'done', label: 'Done' },
]

const UNASSIGN = '_unassign'

function pluralTask(n: number) {
  return `${n} task${n === 1 ? '' : 's'}`
}

interface BulkActionBarProps {
  tasks: Task[]
  onClear: () => void
}

export default function BulkActionBar({ tasks, onClear }: BulkActionBarProps) {
  const { user, isAdmin } = useAuth()
  const { data: users = [] } = useUsers()
  const bulkUpdate = useBulkUpdateTasks()
  const bulkDelete = useBulkDeleteTasks()
  const restore = useRestoreTask()

  const manageable = tasks.filter((t) => isAdmin || t.createdBy._id === user?._id)
  const allIds = tasks.map((t) => t._id)
  const manageableIds = manageable.map((t) => t._id)
  const restrictedCount = tasks.length - manageable.length

  function handleStatusChange(status: string) {
    bulkUpdate.mutate(
      { ids: allIds, status: status as Task['status'] },
      {
        onSuccess: () => {
          toast.success(`Updated status for ${pluralTask(allIds.length)}`)
          onClear()
        },
        onError: () => toast.error('Failed to update tasks'),
      },
    )
  }

  function handleAssigneeChange(userId: string) {
    if (manageableIds.length === 0) return
    const assignedTo = userId === UNASSIGN ? null : userId
    const assignedToUser = userId === UNASSIGN ? null : (users.find((u) => u._id === userId) ?? null)
    bulkUpdate.mutate(
      { ids: manageableIds, assignedTo, assignedToUser },
      {
        onSuccess: () => {
          toast.success(`Reassigned ${pluralTask(manageableIds.length)}`)
          onClear()
        },
        onError: () => toast.error('Failed to reassign tasks'),
      },
    )
  }

  function handleDelete() {
    if (manageableIds.length === 0) return
    const ids = manageableIds
    bulkDelete.mutate(ids, {
      onSuccess: () => {
        onClear()
        toast(`${pluralTask(ids.length)} deleted`, {
          duration: 5000,
          action: {
            label: 'Undo',
            onClick: () => {
              Promise.all(ids.map((id) => restore.mutateAsync(id)))
                .then(() => toast.success('Tasks restored'))
                .catch(() => toast.error('Failed to restore some tasks'))
            },
          },
        })
      },
      onError: () => toast.error('Failed to delete tasks'),
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-4 py-2.5">
      <span className="text-sm font-medium">{pluralTask(tasks.length)} selected</span>

      <Select onValueChange={handleStatusChange}>
        <SelectTrigger className="h-8 w-40">
          <SelectValue placeholder="Change status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={handleAssigneeChange} disabled={manageableIds.length === 0}>
        <SelectTrigger className="h-8 w-40">
          <SelectValue placeholder="Reassign" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNASSIGN}>Unassigned</SelectItem>
          {users.map((u) => (
            <SelectItem key={u._id} value={u._id}>
              {u.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" disabled={manageableIds.length === 0}>
            <Trash2 className="size-4" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pluralTask(manageableIds.length)}?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll have a few seconds to undo before they're gone for good.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {restrictedCount > 0 && (
        <span className="text-xs text-muted-foreground">
          Reassign/delete only applies to {pluralTask(manageable.length)} you created
        </span>
      )}

      <Button variant="ghost" size="sm" className="ml-auto" onClick={onClear}>
        <X className="size-4" />
        Clear
      </Button>
    </div>
  )
}
