import { Link } from 'react-router-dom'
import { CalendarDays, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import StatusBadge from '@/components/shared/StatusBadge'
import PriorityBadge from '@/components/shared/PriorityBadge'
import { useCurrentWorkspace } from '@/context/WorkspaceContext'
import type { Task } from '@/hooks/useTasks'

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function isOverdue(task: Task) {
  return task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date()
}

export default function TaskCard({ task }: { task: Task }) {
  const { slug } = useCurrentWorkspace()
  return (
    <Link to={`/w/${slug}/tasks/${task._id}`} state={{ from: `/w/${slug}/tasks` }} className="group block">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold leading-snug line-clamp-2">
              {task.title}
            </CardTitle>
            <PriorityBadge priority={task.priority} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 pt-0">
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <StatusBadge status={task.status} />
            {task.dueDate && (
              <span className={`flex items-center gap-1 text-xs ${isOverdue(task) ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                <CalendarDays className="size-3" />
                {fmt(task.dueDate)}
                {isOverdue(task) && ' · Overdue'}
              </span>
            )}
          </div>
          {task.assignedTo && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="size-3" />
              {task.assignedTo.name}
            </span>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
