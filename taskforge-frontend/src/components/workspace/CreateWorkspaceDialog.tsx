import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useCreateWorkspace } from '@/hooks/useWorkspaces'
import { createWorkspaceSchema, type CreateWorkspaceInput } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldContent, FieldError, FieldGroup, FieldDescription } from '@/components/ui/field'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function CreateWorkspaceDialog() {
  const [open, setOpen] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const navigate = useNavigate()
  const create = useCreateWorkspace()

  const form = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: { name: '', slug: '' },
  })

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value
    form.setValue('name', name)
    if (!slugTouched) form.setValue('slug', slugify(name))
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugTouched(true)
    form.setValue('slug', slugify(e.target.value))
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      form.reset()
      setSlugTouched(false)
    }
  }

  async function onSubmit(values: CreateWorkspaceInput) {
    try {
      const workspace = await create.mutateAsync(values)
      toast.success(`"${workspace.name}" created`)
      handleOpenChange(false)
      navigate(`/w/${workspace.slug}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Failed to create workspace')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New workspace
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>New workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Acme Product"
                  {...form.register('name')}
                  onChange={handleNameChange}
                  aria-invalid={!!form.formState.errors.name}
                  autoFocus
                />
              </FieldContent>
              {form.formState.errors.name && <FieldError>{form.formState.errors.name.message}</FieldError>}
            </Field>

            <Field>
              <FieldLabel>URL</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="acme-product"
                  {...form.register('slug')}
                  onChange={handleSlugChange}
                  aria-invalid={!!form.formState.errors.slug}
                />
              </FieldContent>
              <FieldDescription>/w/{form.watch('slug') || '…'}</FieldDescription>
              {form.formState.errors.slug && <FieldError>{form.formState.errors.slug.message}</FieldError>}
            </Field>

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Creating…' : 'Create workspace'}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
