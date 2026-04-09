import { Button } from '@renderer/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { PanelLeftClose, PanelLeftOpen, Settings } from 'lucide-react'
import { RepositorySwitcher } from './RepositorySwitcher'
import { WorktreeSwitcher } from './WorktreeSwitcher'

interface MainHeaderProps {
  onSettingsClick: () => void
  hasCurrentRepository?: boolean
  sidebarCollapsed?: boolean
  onSidebarToggle?: () => void
  onWorktreeSelected?: () => void
}

export function MainHeader({
  onSettingsClick,
  hasCurrentRepository,
  sidebarCollapsed,
  onSidebarToggle,
  onWorktreeSelected,
}: MainHeaderProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <header className="flex items-center justify-between border-b px-2 py-1.5">
        <div className="flex items-center gap-1">
          {onSidebarToggle && hasCurrentRepository && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onSidebarToggle}
                  aria-label="サイドバー切り替え"
                >
                  {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{sidebarCollapsed ? 'サイドバーを開く' : 'サイドバーを閉じる'}</TooltipContent>
            </Tooltip>
          )}
          <RepositorySwitcher />
          {hasCurrentRepository && <WorktreeSwitcher onWorktreeSelected={onWorktreeSelected} />}
        </div>
        <div className="flex items-center gap-1">
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
