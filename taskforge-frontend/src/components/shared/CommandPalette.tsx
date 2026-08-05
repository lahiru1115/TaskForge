import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  LayoutDashboard,
  ClipboardList,
  Kanban,
  CalendarDays,
  Trash2,
  User,
  Users,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { useAuth } from '@/context/AuthContext'
import { useCurrentWorkspace } from '@/context/WorkspaceContext'
import { useDarkMode } from '@/hooks/useDarkMode'
import type { Task, TasksResponse } from '@/hooks/useTasks'

export const OPEN_COMMAND_PALETTE_EVENT = 'open-command-palette'

function collectCachedTasks(
  entries: [readonly unknown[], unknown][],
): Task[] {
  const byId = new Map<string, Task>()
  for (const [, data] of entries) {
    if (!data || typeof data !== 'object') continue
    if (Array.isArray((data as TasksResponse).tasks)) {
      for (const t of (data as TasksResponse).tasks) byId.set(t._id, t)
    } else if ('_id' in data && 'title' in data && 'status' in data) {
      const t = data as Task
      byId.set(t._id, t)
    }
  }
  return Array.from(byId.values())
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { logout } = useAuth()
  const { slug } = useCurrentWorkspace()
  const [dark, toggleDark] = useDarkMode()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    function onOpenEvent() {
      setOpen(true)
    }
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenEvent)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenEvent)
    }
  }, [])

  const tasks = useMemo(() => {
    if (!open) return []
    const entries = queryClient.getQueriesData<unknown>({ queryKey: ['ws', slug, 'tasks'] })
    return collectCachedTasks(entries).slice(0, 200)
  }, [open, queryClient, slug])

  function runCommand(action: () => void) {
    setOpen(false)
    action()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search tasks or jump to a page…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => runCommand(() => navigate(`/w/${slug}`))}>
            <LayoutDashboard />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate(`/w/${slug}/tasks`))}>
            <ClipboardList />
            Tasks
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate(`/w/${slug}/board`))}>
            <Kanban />
            Board
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate(`/w/${slug}/calendar`))}>
            <CalendarDays />
            Calendar
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate(`/w/${slug}/trash`))}>
            <Trash2 />
            Trash
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate(`/w/${slug}/settings/members`))}>
            <Users />
            Members
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate(`/w/${slug}/profile`))}>
            <User />
            Profile
          </CommandItem>
        </CommandGroup>

        {tasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {tasks.map((task) => (
              <CommandItem
                key={task._id}
                value={`${task.title} ${task._id}`}
                onSelect={() =>
                  runCommand(() =>
                    navigate(`/w/${slug}/tasks/${task._id}`, { state: { from: `/w/${slug}/tasks` } }),
                  )
                }
              >
                <ClipboardList />
                <span className="truncate">{task.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(toggleDark)}>
            {dark ? <Sun /> : <Moon />}
            {dark ? 'Switch to light mode' : 'Switch to dark mode'}
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                logout()
                navigate('/login')
              })
            }
          >
            <LogOut />
            Log out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
