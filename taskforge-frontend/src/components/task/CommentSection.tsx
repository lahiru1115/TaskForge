import { useState, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { useCurrentWorkspace } from '@/context/WorkspaceContext'
import { useWorkspaceRole } from '@/hooks/useWorkspaceRole'
import { useTaskComments, useAddComment, useDeleteComment } from '@/hooks/useComments'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
  'bg-orange-500', 'bg-rose-500', 'bg-cyan-500',
]

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function CommentSection({ taskId }: { taskId: string }) {
  const { user } = useAuth()
  const { slug } = useCurrentWorkspace()
  const { isManager } = useWorkspaceRole()
  const { data: comments, isLoading } = useTaskComments(slug, taskId)
  const addComment = useAddComment(slug, taskId)
  const deleteComment = useDeleteComment(slug, taskId)

  const [body, setBody] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    try {
      await addComment.mutateAsync(trimmed)
      setBody('')
      textareaRef.current?.focus()
    } catch {
      toast.error('Failed to post comment')
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await deleteComment.mutateAsync(commentId)
      setConfirmingId(null)
    } catch {
      toast.error('Failed to delete comment')
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <div className="grid gap-1.5 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {/* Comment list */}
      {comments && comments.length > 0 ? (
        <div className="grid gap-4">
          {comments.map((c) => {
            const isOwn = c.author === user?._id
            const canDelete = isOwn || isManager
            return (
              <div key={c._id} className="flex gap-3 group">
                <div className={`size-8 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-semibold ${avatarColor(c.authorName)}`}>
                  {initials(c.authorName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{c.authorName}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                    {canDelete && (
                      <Popover
                        open={confirmingId === c._id}
                        onOpenChange={(open) => setConfirmingId(open ? c._id : null)}
                      >
                        <PopoverTrigger asChild>
                          <button
                            className={`ml-auto transition-opacity text-muted-foreground hover:text-destructive ${confirmingId === c._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            aria-label="Delete comment"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="end">
                          <p className="text-sm mb-3">Delete this comment?</p>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => setConfirmingId(null)}>
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={deleteComment.isPending}
                              onClick={() => handleDelete(c._id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{c.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment.</p>
      )}

      {/* Add comment */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className={`size-8 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-semibold mt-0.5 ${avatarColor(user?.name ?? '')}`}>
          {initials(user?.name ?? '?')}
        </div>
        <div className="flex-1 grid gap-2">
          <Textarea
            ref={textareaRef}
            placeholder="Write a comment…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as unknown as React.FormEvent)
            }}
            rows={2}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Ctrl / ⌘ + Enter to submit</p>
            <Button
              type="submit"
              size="sm"
              disabled={!body.trim() || addComment.isPending}
            >
              {addComment.isPending ? 'Posting…' : 'Comment'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
