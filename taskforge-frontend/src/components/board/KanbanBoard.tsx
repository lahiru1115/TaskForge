import { useEffect, useState } from 'react'
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { generateKeyBetween } from 'fractional-indexing'
import { toast } from 'sonner'
import { useMoveTask } from '@/hooks/useTasks'
import type { Task } from '@/hooks/useTasks'
import BoardColumn, { COLUMN_CONFIG } from './BoardColumn'
import BoardCard from './BoardCard'

type Status = Task['status']
const STATUSES = Object.keys(COLUMN_CONFIG) as Status[]

type Columns = Record<Status, Task[]>

function sortByRank(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.rank < b.rank) return -1
    if (a.rank > b.rank) return 1
    return a.createdAt < b.createdAt ? -1 : 1
  })
}

function buildColumns(tasks: Task[]): Columns {
  return STATUSES.reduce<Columns>(
    (acc, s) => ({ ...acc, [s]: sortByRank(tasks.filter((t) => t.status === s)) }),
    {} as Columns,
  )
}

function findColumnOfTask(columns: Columns, taskId: string): Status | null {
  for (const status of STATUSES) {
    if (columns[status].some((t) => t._id === taskId)) return status
  }
  return null
}

interface KanbanBoardProps {
  tasks: Task[]
}

export default function KanbanBoard({ tasks }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Columns>(() => buildColumns(tasks))
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const move = useMoveTask()

  // Sync columns when server data refreshes (e.g. after invalidation)
  useEffect(() => {
    if (!activeTask) setColumns(buildColumns(tasks))
  }, [tasks, activeTask])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  function handleDragStart(event: DragStartEvent) {
    const task = (event.active.data.current as { task: Task })?.task
    if (task) setActiveTask(task)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || !activeTask) return

    const activeId = active.id as string
    const overId = over.id as string

    const sourceCol = findColumnOfTask(columns, activeId)
    // `over.id` is either a task id or a column id (empty column drop target)
    const destCol: Status | null = STATUSES.includes(overId as Status)
      ? (overId as Status)
      : findColumnOfTask(columns, overId)

    if (!sourceCol || !destCol) return

    setColumns((prev) => {
      const sourceTasks = [...prev[sourceCol]]
      const destTasks = sourceCol === destCol ? sourceTasks : [...prev[destCol]]

      const sourceIdx = sourceTasks.findIndex((t) => t._id === activeId)
      if (sourceIdx === -1) return prev

      if (sourceCol === destCol) {
        // Reorder within the same column
        const overIdx = destTasks.findIndex((t) => t._id === overId)
        if (overIdx === -1 || sourceIdx === overIdx) return prev
        return { ...prev, [sourceCol]: arrayMove(sourceTasks, sourceIdx, overIdx) }
      }

      // Move to a different column — determine insertion index
      const [movedTask] = sourceTasks.splice(sourceIdx, 1)
      const overIdx = destTasks.findIndex((t) => t._id === overId)
      const insertIdx = overIdx >= 0 ? overIdx : destTasks.length
      destTasks.splice(insertIdx, 0, movedTask)

      return { ...prev, [sourceCol]: sourceTasks, [destCol]: destTasks }
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active } = event
    const activeId = active.id as string
    setActiveTask(null)

    const destCol = findColumnOfTask(columns, activeId)
    if (!destCol) return

    const destTasks = columns[destCol]
    const idx = destTasks.findIndex((t) => t._id === activeId)
    if (idx === -1) return

    const prev = destTasks[idx - 1] ?? null
    const next = destTasks[idx + 1] ?? null
    const newRank = generateKeyBetween(prev?.rank ?? null, next?.rank ?? null)

    const originalTask = tasks.find((t) => t._id === activeId)
    if (
      originalTask &&
      originalTask.status === destCol &&
      originalTask.rank === newRank
    ) return

    move.mutate(
      { id: activeId, status: destCol, rank: newRank },
      {
        onError: () => {
          toast.error('Failed to move task')
          setColumns(buildColumns(tasks))
        },
      },
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto">
        <div className="flex items-start gap-3" style={{ minWidth: `${STATUSES.length * 272}px` }}>
          {STATUSES.map((status) => (
            <BoardColumn
              key={status}
              id={status}
              tasks={columns[status]}
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
