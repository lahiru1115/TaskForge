import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const config = {
  low:    { label: 'Low',    className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400' },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300' },
  high:   { label: 'High',   className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300' },
}

type Priority = keyof typeof config

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const { label, className } = config[priority] ?? config.medium
  return (
    <Badge variant="outline" className={cn('font-medium', className)}>
      {label}
    </Badge>
  )
}
