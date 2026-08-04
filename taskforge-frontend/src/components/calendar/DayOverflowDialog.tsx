import { format, parseISO } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import StatusBadge from '@/components/shared/StatusBadge'
import PriorityBadge from '@/components/shared/PriorityBadge'
import { useCurrentWorkspace } from '@/context/WorkspaceContext'
import type { Task } from '@/hooks/useTasks'

interface DayOverflowDialogProps {
  dateStr: string
  tasks: Task[]
  onClose: () => void
}

export default function DayOverflowDialog({ dateStr, tasks, onClose }: DayOverflowDialogProps) {
  const navigate = useNavigate()
  const { slug } = useCurrentWorkspace()

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{format(parseISO(dateStr), 'EEEE, MMMM d')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 max-h-[60vh] overflow-y-auto overflow-x-hidden">
          {tasks.map((task) => (
            <button
              key={task._id}
              onClick={() => { onClose(); navigate(`/w/${slug}/tasks/${task._id}`) }}
              className="flex flex-col gap-1.5 rounded-md border px-3 py-2.5 text-left hover:bg-muted/50 transition-colors w-full cursor-pointer"
            >
              <span className="text-sm font-medium">{task.title}</span>
              <div className="flex items-center gap-1.5">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
