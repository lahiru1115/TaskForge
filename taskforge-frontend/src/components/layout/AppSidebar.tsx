import { NavLink, useLocation } from 'react-router-dom'
import { CalendarDays, LayoutDashboard, ClipboardList, Kanban, Trash2, Users } from 'lucide-react'
import { useCurrentWorkspace } from '@/context/WorkspaceContext'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import WorkspaceSwitcher from '@/components/layout/WorkspaceSwitcher'
import NavUser from '@/components/layout/NavUser'

// `to` is relative to the current workspace root — prefixed with /w/:slug at render time.
const NAV_ITEMS = [
  { to: '', label: 'Dashboard', Icon: LayoutDashboard },
  { to: 'tasks', label: 'Tasks', Icon: ClipboardList },
  { to: 'board', label: 'Board', Icon: Kanban },
  { to: 'calendar', label: 'Calendar', Icon: CalendarDays },
  { to: 'trash', label: 'Trash', Icon: Trash2 },
  { to: 'settings/members', label: 'Members', Icon: Users },
] as const

export default function AppSidebar() {
  const { slug } = useCurrentWorkspace()
  const location = useLocation()

  // Task detail has no direct nav item — it highlights whichever tab the user
  // arrived from (Tasks list, Board, or Calendar), carried via navigation state.
  const isTaskDetail = new RegExp(`^/w/${slug}/tasks/[^/]+$`).test(location.pathname)
  const referrer = (location.state as { from?: string } | null)?.from

  function workspacePath(to: string) {
    return to ? `/w/${slug}/${to}` : `/w/${slug}`
  }

  function isItemActive(fullPath: string) {
    return isTaskDetail ? referrer === fullPath : location.pathname === fullPath
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ to, label, Icon }) => {
                const fullPath = workspacePath(to)
                return (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton asChild isActive={isItemActive(fullPath)} tooltip={label}>
                      <NavLink to={fullPath} end>
                        <Icon />
                        <span>{label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
