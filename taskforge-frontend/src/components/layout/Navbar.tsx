import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Sun, Moon, Menu, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import AppLogo from '@/components/shared/AppLogo'

const NAV_LINK_CLASS = 'rounded-md px-3 py-1.5 text-sm font-medium transition-colors'
const ACTIVE_CLASS = 'bg-accent text-accent-foreground'
const INACTIVE_CLASS = 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'

function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('tf-theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('tf-theme', dark ? 'dark' : 'light')
  }, [dark])

  return [dark, () => setDark((d) => !d)] as const
}

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [dark, toggleDark] = useDarkMode()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  // On task detail pages, highlight whichever list view the user came from
  const isTaskDetail = /^\/tasks\/[^/]+$/.test(location.pathname)
  const referrer = (location.state as { from?: string } | null)?.from

  function navClass(path: string) {
    return ({ isActive: routerActive }: { isActive: boolean }) => {
      const active = isTaskDetail ? referrer === path : routerActive
      return cn(NAV_LINK_CLASS, active ? ACTIVE_CLASS : INACTIVE_CLASS)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
            <AppLogo size={24} />
            TaskForge
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <NavLink to="/" end className={navClass('/')}>
              Dashboard
            </NavLink>
            <NavLink to="/tasks" end className={navClass('/tasks')}>
              Tasks
            </NavLink>
            <NavLink to="/board" end className={navClass('/board')}>
              Board
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <>
              <Link
                to="/profile"
                className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:inline"
              >
                {user.name}
              </Link>
              {isAdmin && (
                <span className="hidden sm:inline rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Admin
                </span>
              )}
            </>
          )}
          <Button variant="ghost" size="icon-sm" onClick={toggleDark} aria-label="Toggle theme">
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="hidden sm:inline-flex" onClick={handleLogout} aria-label="Log out">
                <LogOut />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Log out</TooltipContent>
          </Tooltip>
          <Button
            variant="ghost"
            size="icon-sm"
            className="sm:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="sm:hidden border-t bg-background px-4 py-3 flex flex-col gap-1">
          <NavLink to="/" end className={navClass('/')}>Dashboard</NavLink>
          <NavLink to="/tasks" end className={navClass('/tasks')}>Tasks</NavLink>
          <NavLink to="/board" end className={navClass('/board')}>Board</NavLink>
          {user && (
            <div className="mt-2 pt-2 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {user.name}
                </Link>
                {isAdmin && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    Admin
                  </span>
                )}
              </div>
              <Button variant="ghost" size="icon-sm" onClick={handleLogout} aria-label="Log out">
                <LogOut />
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
