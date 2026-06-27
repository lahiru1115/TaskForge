import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const config = {
  open:        { label: 'Open',        className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300' },
  testing:     { label: 'Testing',     className: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300' },
  done:        { label: 'Done',        className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300' },
}

type Status = keyof typeof config

export default function StatusBadge({ status }: { status: Status }) {
  const { label, className } = config[status] ?? config.open
  return (
    <Badge variant="outline" className={cn('font-medium', className)}>
      {label}
    </Badge>
  )
}
