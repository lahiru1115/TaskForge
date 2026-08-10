import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateTask } from '@/hooks/useTasks'
import { useCurrentWorkspace } from '@/context/WorkspaceContext'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import TaskForm from '@/components/task/TaskForm'
import type { TaskInput } from '@/lib/schemas'

interface CreateTaskDialogProps {
  defaultDueDate?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function CreateTaskDialog({ defaultDueDate, open: externalOpen, onOpenChange: externalOnOpenChange }: CreateTaskDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const setOpen = isControlled ? (externalOnOpenChange ?? (() => {})) : setInternalOpen

  const { slug } = useCurrentWorkspace()
  const create = useCreateTask(slug)

  async function handleSubmit(values: TaskInput) {
    const body = {
      ...values,
      assignedTo: values.assignedTo === '' ? undefined : values.assignedTo,
      dueDate: values.dueDate || undefined,
    }
    try {
      await create.mutateAsync(body)
      toast.success('Task created')
      setOpen(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Failed to create task')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="size-4" />
            New task
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <TaskForm
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          submitLabel="Create task"
          defaultValues={defaultDueDate ? { dueDate: defaultDueDate } : undefined}
        />
      </DialogContent>
    </Dialog>
  )
}
