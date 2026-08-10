import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import api from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { AUTH_USER_KEY, LAST_WORKSPACE_KEY } from '@/lib/storage'

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
  /** Platform staff flag (`User.role`) — grants no tenant access. Not a workspace permission; see useWorkspaceRole(). */
  isPlatformAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

/**
 * Drop everything scoped to the account that was signed in: the cached API
 * responses (TanStack's cache is a module singleton, so it outlives sign-out)
 * and the last-visited workspace pointer. Without this the next account to
 * sign in on the same browser is served the previous user's cached workspace
 * and redirected into a workspace it may not even be a member of.
 */
function clearAccountState() {
  localStorage.removeItem(LAST_WORKSPACE_KEY)
  queryClient.clear()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser)

  const login = useCallback((u: AuthUser) => {
    // Covers the api.ts 401 interceptor, which drops tf_user and hard-redirects
    // to /login without ever running logout() — so a different account signing
    // in that way still starts clean.
    const previous = loadUser()
    if (previous && previous._id !== u._id) clearAccountState()

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(u))
    setUser(u)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout')
    } catch {
      // best-effort — clear client state regardless
    }
    localStorage.removeItem(AUTH_USER_KEY)
    clearAccountState()
    setUser(null)
  }, [])

  const updateUser = useCallback((u: AuthUser) => {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(u))
    setUser(u)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isPlatformAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
