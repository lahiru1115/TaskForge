import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import api from '@/lib/api'

export interface AuthUser {
  _id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

interface AuthContextValue {
  user: AuthUser | null
  login: (user: AuthUser) => void
  logout: () => void
  updateUser: (user: AuthUser) => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('tf_user')
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser)

  const login = useCallback((u: AuthUser) => {
    localStorage.setItem('tf_user', JSON.stringify(u))
    setUser(u)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout')
    } catch {
      // best-effort — clear client state regardless
    }
    localStorage.removeItem('tf_user')
    setUser(null)
  }, [])

  const updateUser = useCallback((u: AuthUser) => {
    localStorage.setItem('tf_user', JSON.stringify(u))
    setUser(u)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
