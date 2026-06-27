import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Link } from 'react-router-dom'
import { CalendarDays, GripVertical, User } from 'lucide-react'
import PriorityBadge from '@/components/shared/PriorityBadge'
import type { Task } from '@/hooks/useTasks'
import { cn } from '@/lib/utils'

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function isOverdue(task: Task) {
  return task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date()
}

interface BoardCardProps {
  task: Task
  isDragOverlay?: boolean
}

export default function BoardCard({ task, isDragOverlay = false }: BoardCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
    data: { task },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-lg border bg-card text-card-foreground shadow-sm',
        isDragging && !isDragOverlay && 'opacity-40',
        isDragOverlay && 'shadow-lg rotate-1 cursor-grabbing',
        !isDragging && !isDragOverlay && 'cursor-grab',
      )}
    >
      <div className="flex items-start gap-1 p-3">
        <button
          {...listeners}
          {...attributes}
          className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          aria-label="Drag to reorder"
          tabIndex={0}
        >
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <Link
            to={`/tasks/${task._id}`}
            state={{ from: '/board' }}
            onClick={(e) => isDragging && e.preventDefault()}
            className="block text-sm font-medium leading-snug hover:underline underline-offset-2 line-clamp-2"
          >
            {task.title}
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <PriorityBadge priority={task.priority} />

            {task.dueDate && (
              <span
                className={cn(
                  'flex items-center gap-1 text-xs',
                  isOverdue(task) ? 'text-destructive font-medium' : 'text-muted-foreground',
                )}
              >
                <CalendarDays className="size-3 shrink-0" />
                {fmt(task.dueDate)}
                {isOverdue(task) && ' · Overdue'}
              </span>
            )}
          </div>

          {task.assignedTo && (
            <span className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
              <User className="size-3 shrink-0" />
              {task.assignedTo.name}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
