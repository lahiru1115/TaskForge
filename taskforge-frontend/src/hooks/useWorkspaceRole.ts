import { useCurrentWorkspace } from '@/context/WorkspaceContext'

// Mirrors the backend's isWorkspaceManager check (services/authz.ts) — owner
// or admin. Combine with a task's createdBy for the full canManage parity;
// comment deletion uses isManager alone, with no creator fallback.
export function useWorkspaceRole() {
  const { role } = useCurrentWorkspace()
  return {
    role,
    isManager: role === 'owner' || role === 'admin',
  }
}
