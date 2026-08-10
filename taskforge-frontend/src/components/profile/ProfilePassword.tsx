import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { KeyRound, X } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldContent, FieldError, FieldGroup } from '@/components/ui/field'

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters').max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
type PasswordInput = z.infer<typeof passwordSchema>

export default function ProfilePassword() {
  const [open, setOpen] = useState(false)

  const form = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  async function onSubmit(values: PasswordInput) {
    try {
      await api.patch('/api/users/me/password', values)
      toast.success('Password changed successfully')
      form.reset()
      setOpen(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Failed to change password')
    }
  }

  function handleCancel() {
    form.reset()
    setOpen(false)
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4 text-muted-foreground" />
            Password
          </CardTitle>
          {!open && (
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              Change
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-6">
        {open ? (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel>Current password</FieldLabel>
                <FieldContent>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...form.register('currentPassword')}
                    aria-invalid={!!form.formState.errors.currentPassword}
                  />
                </FieldContent>
                {form.formState.errors.currentPassword && (
                  <FieldError>{form.formState.errors.currentPassword.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>New password</FieldLabel>
                <FieldContent>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...form.register('newPassword')}
                    aria-invalid={!!form.formState.errors.newPassword}
                  />
                </FieldContent>
                {form.formState.errors.newPassword && (
                  <FieldError>{form.formState.errors.newPassword.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Confirm new password</FieldLabel>
                <FieldContent>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...form.register('confirmPassword')}
                    aria-invalid={!!form.formState.errors.confirmPassword}
                  />
                </FieldContent>
                {form.formState.errors.confirmPassword && (
                  <FieldError>{form.formState.errors.confirmPassword.message}</FieldError>
                )}
              </Field>

              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving…' : 'Update password'}
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
          <p className="text-sm text-muted-foreground">••••••••</p>
        )}
      </CardContent>
    </Card>
  )
}
