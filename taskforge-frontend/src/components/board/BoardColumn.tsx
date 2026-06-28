import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import BoardCard from './BoardCard'
import type { Task } from '@/hooks/useTasks'

export const COLUMN_CONFIG = {
  open:        { label: 'Open',        accent: 'border-t-slate-400 dark:border-t-slate-500' },
  in_progress: { label: 'In Progress', accent: 'border-t-blue-400 dark:border-t-blue-500' },
  testing:     { label: 'Testing',     accent: 'border-t-violet-400 dark:border-t-violet-500' },
  done:        { label: 'Done',        accent: 'border-t-green-400 dark:border-t-green-500' },
} as const

type ColumnId = keyof typeof COLUMN_CONFIG

interface BoardColumnProps {
  id: ColumnId
  tasks: Task[]
  activeId: string | null
}

export default function BoardColumn({ id, tasks, activeId }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const config = COLUMN_CONFIG[id]
  const taskIds = tasks.map((t) => t._id)

  return (
    <div
      className={cn(
        'flex min-w-68 flex-1 flex-col rounded-lg border border-t-4',
        config.accent,
        isOver && 'ring-2 ring-primary/30',
      )}
    >
      {/* Sticky column header */}
      <div className="flex shrink-0 items-center justify-between px-3 py-2.5">
        <span className="text-sm font-semibold text-foreground">{config.label}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      {/* Scrollable card list — each column scrolls independently */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className="flex flex-col gap-2 overflow-y-auto p-2 pt-0 min-h-50 h-[calc(100vh-18rem)]"
        >
          {tasks.map((task) => (
            <BoardCard key={task._id} task={task} isDragOverlay={false} />
          ))}

          {tasks.length === 0 && activeId === null && (
            <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-muted-foreground/20 py-6 text-xs text-muted-foreground/50">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}
