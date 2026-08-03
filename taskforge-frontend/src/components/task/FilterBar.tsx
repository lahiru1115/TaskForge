import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useUsers } from '@/hooks/useUsers'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import type { TaskFilters } from '@/hooks/useTasks'

interface FilterBarProps {
  filters: TaskFilters
  onChange: (f: TaskFilters) => void
}

const STATUS_OPTIONS = [
  { value: 'open',        label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'testing',     label: 'Testing' },
  { value: 'done',        label: 'Done' },
]

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
]

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'createdAt',  label: 'Oldest first' },
  { value: 'dueDate',    label: 'Due date ↑' },
  { value: '-dueDate',   label: 'Due date ↓' },
  { value: '-priority',  label: 'Priority ↓' },
]

export function FilterSelect({
  value,
  placeholder,
  options,
  onChange,
  clearable = true,
}: {
  value: string | undefined
  placeholder: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
  clearable?: boolean
}) {
  // Map empty/undefined to '_all' so Radix always has a valid non-empty value
  const selectValue = value || '_all'
  const isActive = selectValue !== '_all'

  return (
    <Select value={selectValue} onValueChange={(v) => onChange(v === '_all' ? '' : v)}>
      <SelectTrigger
        className={cn('w-35', !isActive && 'text-muted-foreground')}
        onClear={clearable && isActive ? () => onChange('') : undefined}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="_all">{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const CLEAR: TaskFilters = { search: '', status: '', priority: '', assignedTo: '', sort: '-createdAt' }

function hasActiveFilters(f: TaskFilters) {
  return (f.search ?? '') !== '' ||
    (f.status ?? '') !== '' ||
    (f.priority ?? '') !== '' ||
    (f.assignedTo ?? '') !== ''
}

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const { isAdmin } = useAuth()
  const { data: users = [] } = useUsers()

  function set(key: keyof TaskFilters, value: string) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-45">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-8 pr-8"
          placeholder="Search tasks…"
          value={filters.search ?? ''}
          onChange={(e) => set('search', e.target.value)}
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => set('search', '')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <FilterSelect
        value={filters.status}
        placeholder="Status"
        options={STATUS_OPTIONS}
        onChange={(v) => set('status', v)}
      />
      <FilterSelect
        value={filters.priority}
        placeholder="Priority"
        options={PRIORITY_OPTIONS}
        onChange={(v) => set('priority', v)}
      />
      {isAdmin && (
        <FilterSelect
          value={filters.assignedTo}
          placeholder="Assignee"
          options={users.map((u) => ({ value: u._id, label: u.name }))}
          onChange={(v) => set('assignedTo', v)}
        />
      )}
      <FilterSelect
        value={filters.sort}
        placeholder="Sort"
        options={SORT_OPTIONS}
        onChange={(v) => set('sort', v)}
        clearable={false}
      />

      {hasActiveFilters(filters) && (
        <Button variant="ghost" size="sm" onClick={() => onChange(CLEAR)}>
          <X className="size-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
