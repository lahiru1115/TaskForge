import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value?: string
  onChange: (date: string) => void
  placeholder?: string
  disabled?: boolean
}

export default function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  // Parse "YYYY-MM-DD" as local midnight to avoid timezone day-shift
  const selectedDate = value
    ? new Date(+value.slice(0, 4), +value.slice(5, 7) - 1, +value.slice(8, 10))
    : undefined

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function storeDate(date: Date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    onChange(`${y}-${m}-${d}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 size-4" />
          {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              storeDate(date)
              setOpen(false)
            }
          }}
          disabled={(date) => date < today}
        />
      </PopoverContent>
    </Popover>
  )
}
