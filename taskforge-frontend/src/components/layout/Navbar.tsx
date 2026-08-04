import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Sun, Moon, Menu, X, CalendarDays, LayoutDashboard, ClipboardList, Kanban, Trash2, Search, Users } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useCurrentWorkspace } from '@/context/WorkspaceContext'
import { useDarkMode } from '@/hooks/useDarkMode'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import AppLogo from '@/components/shared/AppLogo'
import { OPEN_COMMAND_PALETTE_EVENT } from '@/components/shared/CommandPalette'
import WorkspaceSwitcher from '@/components/layout/WorkspaceSwitcher'

const NAV_LINK_CLASS = 'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors'
const ACTIVE_CLASS = 'bg-accent text-accent-foreground'
const INACTIVE_CLASS = 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'

// `to` is relative to the current workspace root — prefixed with /w/:slug at render time.
const NAV_ITEMS = [
  { to: '',                  label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: 'tasks',              label: 'Tasks',     Icon: ClipboardList,   end: true },
  { to: 'board',              label: 'Board',     Icon: Kanban,          end: true },
  { to: 'calendar',           label: 'Calendar',  Icon: CalendarDays,    end: true },
  { to: 'trash',              label: 'Trash',     Icon: Trash2,          end: true },
  { to: 'settings/members',   label: 'Members',   Icon: Users,           end: true },
] as const

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const { slug } = useCurrentWorkspace()
  const navigate = useNavigate()
  const location = useLocation()
  const [dark, toggleDark] = useDarkMode()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const isTaskDetail = new RegExp(`^/w/${slug}/tasks/[^/]+$`).test(location.pathname)
  const referrer = (location.state as { from?: string } | null)?.from

  function workspacePath(to: string) {
    return to ? `/w/${slug}/${to}` : `/w/${slug}`
  }

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
        <div className="flex items-center gap-4">
          <Link to={workspacePath('')} className="flex items-center gap-2 font-semibold text-foreground">
            <AppLogo size={24} />
            TaskForge
          </Link>
          <WorkspaceSwitcher />
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={workspacePath(to)} end={end} className={navClass(workspacePath(to))}>
                <Icon className="size-3.5" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="hidden items-center gap-2 text-muted-foreground sm:flex"
            onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT))}
          >
            <Search className="size-3.5" />
            Search
            <kbd className="ml-1 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
          </Button>
          {user && (
            <>
              <Link
                to={workspacePath('profile')}
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
          <Button variant="ghost" size="icon-sm" className="hidden sm:inline-flex" onClick={handleLogout} aria-label="Log out">
            <LogOut />
          </Button>
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
          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={workspacePath(to)} end={end} className={navClass(workspacePath(to))}>
              <Icon className="size-3.5" />
              {label}
            </NavLink>
          ))}
          {user && (
            <div className="mt-2 pt-2 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link
                  to={workspacePath('profile')}
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
