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
  
  const selectedDate = value ? new Date(value) : undefined

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
              onChange(date.toISOString().split('T')[0])
              setOpen(false)
            }
          }}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}
