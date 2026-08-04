import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import Navbar from '@/components/layout/Navbar'
import CommandPalette from '@/components/shared/CommandPalette'
import LoginPage from '@/pages/Login'
import RegisterPage from '@/pages/Register'
import DashboardPage from '@/pages/Dashboard'
import TasksPage from '@/pages/Tasks'
import TaskDetailPage from '@/pages/TaskDetail'
import ProfilePage from '@/pages/Profile'
import BoardPage from '@/pages/Board'
import CalendarPage from '@/pages/Calendar'
import TrashPage from '@/pages/Trash'

function AppLayout() {
  return (
    <>
      <Navbar />
      <CommandPalette />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/trash" element={<TrashPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
