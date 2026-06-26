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
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New task
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          const target = e.target as Element
          if (target?.closest?.('[data-radix-popper-content-wrapper]')) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <TaskForm onSubmit={handleSubmit} submitLabel="Create task" />
      </DialogContent>
    </Dialog>
  )
}
