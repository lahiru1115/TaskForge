import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Link } from 'react-router-dom'
import { CalendarDays, GripVertical, User } from 'lucide-react'
import PriorityBadge from '@/components/shared/PriorityBadge'
import { useCurrentWorkspace } from '@/context/WorkspaceContext'
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
  const { slug } = useCurrentWorkspace()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
    data: { task },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      // Drag listeners on the whole card so any area initiates drag
      {...listeners}
      {...attributes}
      className={cn(
        'group relative rounded-lg border bg-card text-card-foreground shadow-sm',
        'select-none touch-none', // prevent text selection and scroll-on-touch during drag
        isDragging && !isDragOverlay && 'opacity-40',
        isDragOverlay && 'shadow-lg rotate-1 cursor-grabbing',
        !isDragging && !isDragOverlay && 'cursor-grab',
      )}
    >
      <div className="flex items-start gap-1 p-3">
        {/* Grip icon — visual affordance only, no separate listeners needed */}
        <GripVertical className="mt-0.5 shrink-0 size-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />

        <div className="min-w-0 flex-1">
          {/* Wrapper div owns line-clamp so the link stays inline.
              Inline link = pointer cursor only over actual text, not full row width. */}
          <div className="line-clamp-2 text-sm font-medium leading-snug">
            <Link
              to={`/w/${slug}/tasks/${task._id}`}
              state={{ from: `/w/${slug}/board` }}
              onClick={(e) => isDragging && e.preventDefault()}
              className="hover:underline underline-offset-2"
            >
              {task.title}
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
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
