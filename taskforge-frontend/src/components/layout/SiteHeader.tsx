import { Search } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { OPEN_COMMAND_PALETTE_EVENT } from '@/components/shared/CommandPalette'

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Button
        variant="outline"
        size="sm"
        className="ml-auto flex items-center gap-2 text-muted-foreground"
        onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT))}
      >
        <Search className="size-3.5" />
        Search
        <kbd className="ml-1 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
      </Button>
    </header>
  )
}
