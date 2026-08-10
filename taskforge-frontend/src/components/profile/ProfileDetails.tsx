import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserRound, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldContent, FieldError, FieldGroup } from '@/components/ui/field'

const editSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
})
type EditInput = z.infer<typeof editSchema>

interface ProfileDetailsProps {
  onUserUpdated: (name: string, email: string) => void
}

export default function ProfileDetails({ onUserUpdated }: ProfileDetailsProps) {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)

  const form = useForm<EditInput>({
    resolver: zodResolver(editSchema),
    values: { name: user?.name ?? '', email: user?.email ?? '' },
  })

  async function onSubmit(values: EditInput) {
    try {
      const { data } = await api.patch('/api/users/me', values)
      onUserUpdated(data.user.name, data.user.email)
      toast.success('Profile updated')
      setEditing(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Failed to update profile')
    }
  }

  function handleCancel() {
    form.reset({ name: user?.name ?? '', email: user?.email ?? '' })
    setEditing(false)
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="size-4 text-muted-foreground" />
            Personal information
          </CardTitle>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-6">
        {editing ? (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel>Full name</FieldLabel>
                <FieldContent>
                  <Input {...form.register('name')} aria-invalid={!!form.formState.errors.name} autoFocus />
                </FieldContent>
                {form.formState.errors.name && <FieldError>{form.formState.errors.name.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel>Email</FieldLabel>
                <FieldContent>
                  <Input type="email" {...form.register('email')} aria-invalid={!!form.formState.errors.email} />
                </FieldContent>
                {form.formState.errors.email && <FieldError>{form.formState.errors.email.message}</FieldError>}
              </Field>

              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving…' : 'Save changes'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={form.formState.isSubmitting}
                >
                  <X className="size-4" />
                  Cancel
                </Button>
              </div>
            </FieldGroup>
          </form>
        ) : (
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Full name
              </FieldLabel>
              <p className="text-sm text-foreground">{user?.name}</p>
            </Field>
            <Field>
              <FieldLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Email
              </FieldLabel>
              <p className="text-sm text-foreground">{user?.email}</p>
            </Field>
          </FieldGroup>
        )}
      </CardContent>
    </Card>
  )
}
