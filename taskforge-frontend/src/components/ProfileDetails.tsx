import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, ShieldCheck, Calendar, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Field, FieldLabel, FieldContent, FieldError, FieldGroup } from '@/components/ui/field'

const editSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
})
type EditInput = z.infer<typeof editSchema>

interface ProfileDetailsProps {
  memberSince: string | undefined
  loading: boolean
  onUserUpdated: (name: string, email: string) => void
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ProfileDetails({ memberSince, loading, onUserUpdated }: ProfileDetailsProps) {
  const { user, isAdmin } = useAuth()
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
    <Card>
      <CardContent className="pt-6 pb-6">
        {editing ? (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel>Full name</FieldLabel>
                <FieldContent>
                  <Input
                    {...form.register('name')}
                    aria-invalid={!!form.formState.errors.name}
                  />
                </FieldContent>
                {form.formState.errors.name && (
                  <FieldError>{form.formState.errors.name.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Email</FieldLabel>
                <FieldContent>
                  <Input
                    type="email"
                    {...form.register('email')}
                    aria-invalid={!!form.formState.errors.email}
                  />
                </FieldContent>
                {form.formState.errors.email && (
                  <FieldError>{form.formState.errors.email.message}</FieldError>
                )}
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
          <div className="grid gap-5">
            <div className="flex items-center justify-between">
              <InfoRow icon={<User className="size-4" />} label="Full name" value={user?.name} loading={false} />
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="size-4" />
                Edit
              </Button>
            </div>
            <InfoRow icon={<Mail className="size-4" />} label="Email" value={user?.email} loading={false} />
            <InfoRow
              icon={<ShieldCheck className="size-4" />}
              label="Role"
              value={isAdmin ? 'Administrator' : 'Member'}
              loading={false}
            />
            <InfoRow
              icon={<Calendar className="size-4" />}
              label="Member since"
              value={memberSince ? fmt(memberSince) : undefined}
              loading={loading}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function InfoRow({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode
  label: string
  value: string | undefined
  loading: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-1 h-4 w-32" />
        ) : (
          <p className="text-sm text-foreground truncate">{value ?? '—'}</p>
        )}
      </div>
    </div>
  )
}
