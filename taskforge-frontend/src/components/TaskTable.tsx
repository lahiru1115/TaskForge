import { Link } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import PriorityBadge from '@/components/PriorityBadge'
import { useAuth } from '@/context/AuthContext'
import type { Task } from '@/hooks/useTasks'

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function isOverdue(task: Task) {
  return task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date()
}

export default function TaskTable({ tasks }: { tasks: Task[] }) {
  const { isAdmin } = useAuth()

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-muted-foreground">
            <th className="px-4 py-3 text-left font-medium">Title</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Priority</th>
            <th className="px-4 py-3 text-left font-medium">Due date</th>
            {isAdmin && <th className="px-4 py-3 text-left font-medium">Assignee</th>}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <Link
                  to={`/tasks/${task._id}`}
                  className="font-medium text-foreground hover:underline underline-offset-2"
                >
                  {task.title}
                </Link>
                {task.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={task.status} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="px-4 py-3">
                {task.dueDate ? (
                  <span className={`flex items-center gap-1 ${isOverdue(task) ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                    <CalendarDays className="size-3.5 shrink-0" />
                    {fmt(task.dueDate)}
                    {isOverdue(task) && <span className="ml-1 text-xs">· Overdue</span>}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              {isAdmin && (
                <td className="px-4 py-3 text-muted-foreground">
                  {task.assignedTo?.name ?? '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
