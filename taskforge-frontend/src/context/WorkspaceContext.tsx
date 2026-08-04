import { createContext, useContext, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useWorkspace, type Workspace, type WorkspaceRole } from '@/hooks/useWorkspaces'

interface WorkspaceContextValue {
  slug: string
  workspace: Workspace | undefined
  role: WorkspaceRole | undefined
  isLoading: boolean
  isError: boolean
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

// Reads :slug from the URL itself rather than taking it as a prop, so any
// component under WorkspaceLayout (see App.tsx, added in a later step) can
// mount this without threading the slug through every level.
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading, isError } = useWorkspace(slug)

  return (
    <WorkspaceContext.Provider
      value={{ slug: slug ?? '', workspace: data?.workspace, role: data?.role, isLoading, isError }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useCurrentWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useCurrentWorkspace must be used inside WorkspaceProvider')
  return ctx
}
