import { useState } from 'react'
import { Search, LogOut, X, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useCurrentWorkspace } from '@/context/WorkspaceContext'
import { useAuth } from '@/context/AuthContext'
import {
  useMembers,
  useUpdateMember,
  useRemoveMember,
  useInvites,
  useRevokeInvite,
  type Member,
  type AssignableRole,
} from '@/hooks/useMembers'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import InviteMemberDialog from '@/components/workspace/InviteMemberDialog'

const AVATAR_COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500', 'bg-cyan-500']

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

function avatarColor(id: string) {
  const sum = [...id].reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

const ASSIGNABLE_ROLES: { value: AssignableRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
]

function MemberRow({ member, canManage, isSelf }: { member: Member; canManage: boolean; isSelf: boolean }) {
  const { slug } = useCurrentWorkspace()
  const updateMember = useUpdateMember(slug)
  const removeMember = useRemoveMember(slug)

  function handleRoleChange(role: string) {
    updateMember.mutate(
      { userId: member.user._id, role: role as AssignableRole },
      {
        onSuccess: () => toast.success(`${member.user.name} is now ${role}`),
        onError: () => toast.error('Failed to change role'),
      },
    )
  }

  function handleRemove() {
    removeMember.mutate(member.user._id, {
      onSuccess: () => toast.success(isSelf ? 'You left the workspace' : `${member.user.name} removed`),
      onError: () => toast.error(isSelf ? 'Failed to leave workspace' : 'Failed to remove member'),
    })
  }

  const canChangeRole = canManage && member.role !== 'owner' && !isSelf
  const canRemove = member.role !== 'owner' && (isSelf || canManage)

  return (
    <div className="flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColor(member.user._id)}`}
        >
          {initials(member.user.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">
            {member.user.name}
            {isSelf && <span className="text-muted-foreground"> (you)</span>}
          </p>
          <p className="truncate text-sm text-muted-foreground">{member.user.email}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {canChangeRole ? (
          <Select value={member.role} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {ASSIGNABLE_ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="secondary" className="capitalize">
            {member.role}
          </Badge>
        )}

        {canRemove && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={isSelf ? 'Leave workspace' : 'Remove member'}>
                {isSelf ? <LogOut className="size-4" /> : <X className="size-4" />}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{isSelf ? 'Leave this workspace?' : `Remove ${member.user.name}?`}</AlertDialogTitle>
                <AlertDialogDescription>
                  {isSelf
                    ? "You'll lose access to this workspace's tasks until someone invites you back."
                    : `${member.user.name} will lose access to this workspace immediately.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleRemove}>
                  {isSelf ? 'Leave' : 'Remove'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}

export default function MembersPage() {
  const { slug, role } = useCurrentWorkspace()
  const { user } = useAuth()
  const [search, setSearch] = useState('')

  const { data, isLoading, isError } = useMembers(slug, { q: search || undefined })
  const { data: invites } = useInvites(role === 'owner' || role === 'admin' ? slug : undefined)
  const revokeInvite = useRevokeInvite(slug)

  const canManage = role === 'owner' || role === 'admin'
  const members = data?.members ?? []

  function handleRevoke(inviteId: string, email: string) {
    revokeInvite.mutate(inviteId, {
      onSuccess: () => toast.success(`Invite to ${email} revoked`),
      onError: () => toast.error('Failed to revoke invite'),
    })
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">Who has access to this workspace.</p>
        </div>
        {canManage && <InviteMemberDialog slug={slug} />}
      </div>

      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search members…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load members. Check your connection and try refreshing.
        </div>
      )}

      {isLoading && (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && !isError && members.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Users className="size-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No members match that search.</p>
        </div>
      )}

      {!isLoading && !isError && members.length > 0 && (
        <div className="grid gap-3">
          {members.map((member) => (
            <MemberRow
              key={member._id}
              member={member}
              canManage={canManage}
              isSelf={member.user._id === user?._id}
            />
          ))}
        </div>
      )}

      {canManage && invites && invites.length > 0 && (
        <div className="grid gap-3">
          <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Pending invites
          </h2>
          {invites.map((invite) => (
            <div
              key={invite._id}
              className="flex items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{invite.email}</p>
                <p className="text-xs text-muted-foreground">
                  Invited as {invite.role} · expires {new Date(invite.expiresAt).toLocaleDateString()}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleRevoke(invite._id, invite.email)}>
                Revoke
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
