import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckSquare, Users, Zap } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import AppLogo from '@/components/shared/AppLogo'
import { registerSchema, type RegisterInput } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldContent, FieldError, FieldGroup } from '@/components/ui/field'

const features = [
  { icon: CheckSquare, text: 'Organize tasks with priorities & due dates' },
  { icon: Users, text: 'Assign tasks and collaborate with your team' },
  { icon: Zap, text: 'Track progress from open to done in real-time' },
]

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  async function onSubmit(values: RegisterInput) {
    try {
      const { data } = await api.post('/api/auth/register', values)
      login(data.user)
      toast.success('Welcome to TaskForge!')
      navigate(from ?? '/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      if (msg?.includes('already')) {
        form.setError('email', { message: 'Email already in use' })
      } else {
        toast.error(msg ?? 'Registration failed')
      }
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Branding panel */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 text-white overflow-hidden"
        style={{
          background: '#0f0e1a',
          backgroundImage: [
            'radial-gradient(ellipse 70% 55% at 10% 20%, rgba(99,102,241,0.28) 0%, transparent 70%)',
            'radial-gradient(ellipse 60% 50% at 85% 80%, rgba(139,92,246,0.22) 0%, transparent 70%)',
          ].join(', '),
        }}>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <AppLogo size={32} />
          <span className="text-2xl font-bold tracking-tight">TaskForge</span>
        </div>

        {/* Hero text + features */}
        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              Join the<br />Team Today
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-sm">
              Get started in minutes and streamline your workflow with TaskForge.
            </p>
          </div>

          <div className="space-y-3">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/8 border border-white/6!">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/85 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/35 text-xs">
          © {new Date().getFullYear()} TaskForge. All rights reserved.
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile-only logo */}
          <div className="lg:hidden flex items-center justify-center gap-2">
            <AppLogo size={28} />
            <span className="text-xl font-bold">TaskForge</span>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Create your account</h2>
            <p className="text-muted-foreground text-sm">Join to start managing tasks effortlessly</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="Your name"
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
                    placeholder="you@example.com"
                    {...form.register('email')}
                    aria-invalid={!!form.formState.errors.email}
                  />
                </FieldContent>
                {form.formState.errors.email && (
                  <FieldError>{form.formState.errors.email.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Password</FieldLabel>
                <FieldContent>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...form.register('password')}
                    aria-invalid={!!form.formState.errors.password}
                  />
                </FieldContent>
                {form.formState.errors.password && (
                  <FieldError>{form.formState.errors.password.message}</FieldError>
                )}
              </Field>

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating account…' : 'Create account'}
              </Button>
            </FieldGroup>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/login"
              state={from ? { from } : undefined}
              className="text-primary font-medium underline underline-offset-4 hover:text-primary/80 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
