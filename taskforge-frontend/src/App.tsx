import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import WorkspaceLayout from '@/components/layout/WorkspaceLayout'
import { LAST_WORKSPACE_KEY } from '@/lib/storage'
import AppSidebar from '@/components/layout/AppSidebar'
import SiteHeader from '@/components/layout/SiteHeader'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import CommandPalette from '@/components/shared/CommandPalette'
import LoginPage from '@/pages/Login'
import RegisterPage from '@/pages/Register'
import WorkspacesPage from '@/pages/Workspaces'
import AcceptInvitePage from '@/pages/AcceptInvite'
import DashboardPage from '@/pages/Dashboard'
import TasksPage from '@/pages/Tasks'
import TaskDetailPage from '@/pages/TaskDetail'
import ProfilePage from '@/pages/Profile'
import BoardPage from '@/pages/Board'
import CalendarPage from '@/pages/Calendar'
import TrashPage from '@/pages/Trash'
import MembersPage from '@/pages/settings/Members'

function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <CommandPalette />
        <main className="flex-1 px-4 py-6 md:px-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function RootRedirect() {
  const lastSlug = localStorage.getItem(LAST_WORKSPACE_KEY)
  return <Navigate to={lastSlug ? `/w/${lastSlug}` : '/workspaces'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* Not gated by ProtectedRoute — the page itself handles the logged-out state. */}
      <Route path="/invite/:token" element={<AcceptInvitePage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/workspaces" element={<WorkspacesPage />} />

        <Route path="/w/:slug" element={<WorkspaceLayout />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="tasks/:id" element={<TaskDetailPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="board" element={<BoardPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="trash" element={<TrashPage />} />
            <Route path="settings/members" element={<MembersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
