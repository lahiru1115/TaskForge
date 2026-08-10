import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronsUpDown, Building2, Settings2 } from 'lucide-react'
import { useCurrentWorkspace } from '@/context/WorkspaceContext'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
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
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-expanded={open}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">{workspace?.name ?? 'Select workspace'}</span>
                <span className="truncate text-xs text-sidebar-foreground/60">TaskForge</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" side="right" align="start">
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
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
