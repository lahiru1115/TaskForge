import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { taskSchema, type TaskInput } from '@/lib/schemas'
import { useUsers } from '@/hooks/useUsers'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field, FieldLabel, FieldContent, FieldError, FieldGroup } from '@/components/ui/field'
import DatePicker from '@/components/shared/DatePicker'

interface TaskFormProps {
  defaultValues?: Partial<TaskInput>
  onSubmit: (values: TaskInput) => Promise<void>
  submitLabel?: string
  /** When true, only the status field is editable (assignee view) */
  statusOnly?: boolean
}

export default function TaskForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Save',
  statusOnly = false,
}: TaskFormProps) {
  const { isAdmin } = useAuth()
  const { data: users = [] } = useUsers()

  const form = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      status: 'open',
      dueDate: '',
      assignedTo: '',
      ...defaultValues,
    },
  })

  const canEditAll = !statusOnly

  const statusField = (
    <Field>
      <FieldLabel>Status</FieldLabel>
      <FieldContent>
        <Select value={form.watch('status')} onValueChange={(value: string) => form.setValue('status', value as TaskInput['status'])}>
          <SelectTrigger className="w-full" aria-invalid={!!form.formState.errors.status}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="testing">Testing</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </FieldContent>
      {form.formState.errors.status && (
        <FieldError>{form.formState.errors.status.message}</FieldError>
      )}
    </Field>
  )

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup className="gap-4">
        {canEditAll && (
          <>
            <Field>
              <FieldLabel>Title</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Task title"
                  {...form.register('title')}
                  aria-invalid={!!form.formState.errors.title}
                />
              </FieldContent>
              {form.formState.errors.title && (
                <FieldError>{form.formState.errors.title.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <FieldContent>
                <Textarea
                  placeholder="Optional description"
                  rows={3}
                  {...form.register('description')}
                  aria-invalid={!!form.formState.errors.description}
                />
              </FieldContent>
              {form.formState.errors.description && (
                <FieldError>{form.formState.errors.description.message}</FieldError>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Priority</FieldLabel>
                <FieldContent>
                  <Select value={form.watch('priority')} onValueChange={(value: string) => form.setValue('priority', value as TaskInput['priority'])}>
                    <SelectTrigger className="w-full" aria-invalid={!!form.formState.errors.priority}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
                {form.formState.errors.priority && (
                  <FieldError>{form.formState.errors.priority.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Due date</FieldLabel>
                <FieldContent>
                  <DatePicker
                    value={form.watch('dueDate')}
                    onChange={(value) => form.setValue('dueDate', value)}
                  />
                </FieldContent>
                {form.formState.errors.dueDate && (
                  <FieldError>{form.formState.errors.dueDate.message}</FieldError>
                )}
              </Field>
            </div>

            {isAdmin ? (
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Assign to</FieldLabel>
                  <FieldContent>
                    <Select
                      value={form.watch('assignedTo') || '_none'}
                      onValueChange={(v: string) => form.setValue('assignedTo', v === '_none' ? '' : (v as string))}
                    >
                      <SelectTrigger className="w-full" aria-invalid={!!form.formState.errors.assignedTo}>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="_none">Unassigned</SelectItem>
                        {users.map((u) => (
                          <SelectItem key={u._id} value={u._id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                  {form.formState.errors.assignedTo && (
                    <FieldError>{form.formState.errors.assignedTo.message}</FieldError>
                  )}
                </Field>

                {statusField}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">{statusField}</div>
            )}
          </>
        )}

        {!canEditAll && <div className="grid grid-cols-2 gap-4">{statusField}</div>}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </FieldGroup>
    </form>
  )
}
