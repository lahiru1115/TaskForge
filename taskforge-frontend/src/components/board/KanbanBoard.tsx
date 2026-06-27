import { useState } from 'react'
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { toast } from 'sonner'
import { useMoveTaskStatus } from '@/hooks/useTasks'
import type { Task } from '@/hooks/useTasks'
import BoardColumn, { COLUMN_CONFIG } from './BoardColumn'
import BoardCard from './BoardCard'

const STATUSES = Object.keys(COLUMN_CONFIG) as Task['status'][]

interface KanbanBoardProps {
  tasks: Task[]
}

export default function KanbanBoard({ tasks }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const move = useMoveTaskStatus()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  const byStatus = STATUSES.reduce<Record<Task['status'], Task[]>>(
    (acc, s) => ({ ...acc, [s]: tasks.filter((t) => t.status === s) }),
    {} as Record<Task['status'], Task[]>,
  )

  function handleDragStart(event: DragStartEvent) {
    const task = (event.active.data.current as { task: Task })?.task
    if (task) setActiveTask(task)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as Task['status']
    const task = tasks.find((t) => t._id === taskId)

    if (!task || task.status === newStatus) return

    move.mutate(
      { id: taskId, status: newStatus },
      {
        onError: () => toast.error('Failed to move task'),
      },
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto">
        <div className="flex items-start gap-3" style={{ minWidth: `${STATUSES.length * 272}px` }}>
          {STATUSES.map((status) => (
            <BoardColumn
              key={status}
              id={status}
              tasks={byStatus[status]}
              activeId={activeTask?._id ?? null}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeTask && <BoardCard task={activeTask} isDragOverlay />}
      </DragOverlay>
    </DndContext>
  )
}
