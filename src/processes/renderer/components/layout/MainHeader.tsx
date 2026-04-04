import { Button } from '@renderer/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { FolderOpen, PanelLeftClose, PanelLeftOpen, Settings } from 'lucide-react'

interface MainHeaderProps {
  onSettingsClick: () => void
  repositoryName?: string
  onRepositorySwitch?: () => void
  sidebarCollapsed?: boolean
  onSidebarToggle?: () => void
}

export function MainHeader({
  onSettingsClick,
  repositoryName,
  onRepositorySwitch,
  sidebarCollapsed,
  onSidebarToggle,
}: MainHeaderProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          {onSidebarToggle && repositoryName && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSidebarToggle} aria-label="サイドバー切り替え">
                  {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{sidebarCollapsed ? 'サイドバーを開く' : 'サイドバーを閉じる'}</TooltipContent>
            </Tooltip>
          )}
          <div>
            <h1 className="text-lg font-bold leading-tight">Buruma</h1>
            {repositoryName ? (
              <p className="text-xs text-muted-foreground">{repositoryName}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Branch-United Real-time Understanding & Multi-worktree Analyzer</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onRepositorySwitch && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRepositorySwitch} aria-label="リポジトリを開く">
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>リポジトリを開く</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSettingsClick} aria-label="設定を開く">
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>設定</TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  )
}
