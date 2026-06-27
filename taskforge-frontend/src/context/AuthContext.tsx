import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface AuthUser {
  _id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  login: (user: AuthUser, token: string) => void
  logout: () => void
  updateUser: (user: AuthUser) => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadFromStorage(): { user: AuthUser | null; token: string | null } {
  try {
    const token = localStorage.getItem('tf_token')
    const raw = localStorage.getItem('tf_user')
    const user = raw ? (JSON.parse(raw) as AuthUser) : null
    return { user, token }
  } catch {
    return { user: null, token: null }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [{ user, token }, setState] = useState(loadFromStorage)

  const login = useCallback((u: AuthUser, t: string) => {
    localStorage.setItem('tf_token', t)
    localStorage.setItem('tf_user', JSON.stringify(u))
    setState({ user: u, token: t })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('tf_token')
    localStorage.removeItem('tf_user')
    setState({ user: null, token: null })
  }, [])

  const updateUser = useCallback((u: AuthUser) => {
    localStorage.setItem('tf_user', JSON.stringify(u))
    setState((prev) => ({ ...prev, user: u }))
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
