import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateTask } from '@/hooks/useTasks'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import TaskForm from '@/components/TaskForm'
import type { TaskInput } from '@/lib/schemas'

export default function CreateTaskDialog() {
  const [open, setOpen] = useState(false)
  const create = useCreateTask()

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
  }

  async function handleSubmit(values: TaskInput) {
    const body = {
      ...values,
      assignedTo: values.assignedTo === '_none' || values.assignedTo === '' ? undefined : values.assignedTo,
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" onPointerDown={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <TaskForm onSubmit={handleSubmit} submitLabel="Create task" />
      </DialogContent>
    </Dialog>
  )
}
