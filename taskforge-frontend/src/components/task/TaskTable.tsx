import { Link } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import StatusBadge from '@/components/shared/StatusBadge'
import PriorityBadge from '@/components/shared/PriorityBadge'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import type { Task } from '@/hooks/useTasks'

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function isOverdue(task: Task) {
  return task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date()
}

interface TaskTableProps {
  tasks: Task[]
  selected: Map<string, Task>
  onToggle: (task: Task) => void
  onToggleAll: (checked: boolean) => void
}

export default function TaskTable({ tasks, selected, onToggle, onToggleAll }: TaskTableProps) {
  const { isAdmin } = useAuth()
  const allSelected = tasks.length > 0 && tasks.every((t) => selected.has(t._id))
  const someSelected = !allSelected && tasks.some((t) => selected.has(t._id))

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-muted-foreground">
            <th className="w-10 px-4 py-3">
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={(checked) => onToggleAll(checked === true)}
                aria-label="Select all tasks"
              />
            </th>
            <th className="px-4 py-3 text-left font-medium">Title</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Priority</th>
            <th className="px-4 py-3 text-left font-medium">Due date</th>
            {isAdmin && <th className="px-4 py-3 text-left font-medium">Assignee</th>}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr
              key={task._id}
              className={cn(
                'border-b last:border-0 hover:bg-muted/30 transition-colors',
                selected.has(task._id) && 'bg-accent/40',
              )}
            >
              <td className="px-4 py-3">
                <Checkbox
                  checked={selected.has(task._id)}
                  onCheckedChange={() => onToggle(task)}
                  aria-label={`Select ${task.title}`}
                />
              </td>
              <td className="px-4 py-3">
                <Link
                  to={`/tasks/${task._id}`}
                  state={{ from: '/tasks' }}
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
                  <div className={isOverdue(task) ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <CalendarDays className="size-3.5 shrink-0" />
                      {fmt(task.dueDate)}
                    </span>
                    {isOverdue(task) && <span className="text-xs">Overdue</span>}
                  </div>
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
