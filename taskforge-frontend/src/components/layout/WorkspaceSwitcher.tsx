import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronsUpDown, Building2, Settings2 } from 'lucide-react'
import { useCurrentWorkspace } from '@/context/WorkspaceContext'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'

export default function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { slug: currentSlug, workspace } = useCurrentWorkspace()
  const { data: memberships } = useWorkspaces()

  function handleSelect(slug: string) {
    setOpen(false)
    if (slug !== currentSlug) navigate(`/w/${slug}`)
  }

  function handleManage() {
    setOpen(false)
    navigate('/workspaces')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-45 justify-between gap-2 font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Building2 className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{workspace?.name ?? 'Select workspace'}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search workspaces…" />
          <CommandList>
            <CommandEmpty>No workspace found.</CommandEmpty>
            <CommandGroup heading="Workspaces">
              {memberships?.map(({ workspace: w, role }) => (
                <CommandItem key={w._id} value={w.name} onSelect={() => handleSelect(w.slug)}>
                  <Check className={cn('size-4', w.slug === currentSlug ? 'opacity-100' : 'opacity-0')} />
                  <span className="flex-1 truncate">{w.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">{role}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem onSelect={handleManage}>
                <Settings2 className="size-4" />
                Manage workspaces
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
