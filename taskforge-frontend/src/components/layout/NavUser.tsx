import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Sun, Moon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useCurrentWorkspace } from '@/context/WorkspaceContext'
import { useDarkMode } from '@/hooks/useDarkMode'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function NavUser() {
  const { user, isPlatformAdmin, logout } = useAuth()
  const { slug } = useCurrentWorkspace()
  const navigate = useNavigate()
  const [dark, toggleDark] = useDarkMode()

  if (!user) return null

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild size="lg" tooltip={user.name}>
          <Link to={`/w/${slug}/profile`}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
              {initials(user.name)}
            </span>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-sidebar-foreground/60">
                {isPlatformAdmin ? 'Platform admin' : user.email}
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={toggleDark}
          tooltip={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun /> : <Moon />}
          <span>{dark ? 'Light mode' : 'Dark mode'}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={handleLogout} tooltip="Log out">
          <LogOut />
          <span>Log out</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
