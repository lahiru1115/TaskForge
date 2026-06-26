import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertCircle, CheckSquare, Users, Zap, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { loginSchema, type LoginInput } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldContent, FieldError, FieldGroup } from '@/components/ui/field'
import { Alert, AlertDescription } from '@/components/ui/alert'

const features = [
  { icon: CheckSquare, text: 'Organize tasks with priorities & due dates' },
  { icon: Users, text: 'Assign tasks and collaborate with your team' },
  { icon: Zap, text: 'Track progress from open to done in real-time' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginInput) {
    setError(null)
    try {
      const { data } = await api.post('/api/auth/login', values)
      login(data.user, data.token)
      navigate('/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      msg ? setError(msg) : toast.error('Login failed')
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
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 border border-white/[0.07]!">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">TaskForge</span>
        </div>

        {/* Hero text + features */}
        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              Build. Manage.<br />Deliver.
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-sm">
              The all-in-one workspace for high-performing teams to manage work and hit every deadline.
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
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">TaskForge</span>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground text-sm">Sign in to your account to continue</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="gap-5">
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

              {error && (
                <Alert className="border-destructive/50 bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </FieldGroup>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary font-medium underline underline-offset-4 hover:text-primary/80 transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
