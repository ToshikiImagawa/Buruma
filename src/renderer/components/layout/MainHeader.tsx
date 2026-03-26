import { Settings } from 'lucide-react'
import { Button } from '@/renderer/components/ui/button'

interface MainHeaderProps {
  onSettingsClick: () => void
}

export function MainHeader({ onSettingsClick }: MainHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <div>
        <h1 className="text-2xl font-bold">Buruma</h1>
        <p className="text-sm text-muted-foreground">Branch-United Real-time Understanding & Multi-worktree Analyzer</p>
      </div>
      <Button variant="ghost" size="icon" onClick={onSettingsClick} aria-label="設定を開く">
        <Settings className="h-5 w-5" />
      </Button>
    </header>
  )
}
