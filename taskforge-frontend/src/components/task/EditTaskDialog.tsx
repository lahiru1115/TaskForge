import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateTask } from '@/hooks/useTasks'
import type { Task } from '@/hooks/useTasks'
import { useCurrentWorkspace } from '@/context/WorkspaceContext'
import type { TaskInput } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import TaskForm from '@/components/task/TaskForm'

interface EditTaskDialogProps {
  task: Task
  canManage: boolean
}

function toDateInput(iso: string | undefined) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

export default function EditTaskDialog({ task, canManage }: EditTaskDialogProps) {
  const { slug } = useCurrentWorkspace()
  const [open, setOpen] = useState(false)
  const update = useUpdateTask(slug, task._id)

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
          assignedTo: values.assignedTo === '' ? undefined : values.assignedTo,
          dueDate: values.dueDate || undefined,
        }
      : { status: values.status }

    try {
      await update.mutateAsync(body)
      toast.success('Task updated')
      setOpen(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Failed to update task')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
          <span className="hidden sm:inline">Edit</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
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
  );
}
