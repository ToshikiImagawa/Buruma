import { ReactNode } from 'react'
import { MainHeader } from './MainHeader'

interface AppLayoutProps {
  children: ReactNode
  onSettingsClick: () => void
  hasCurrentRepository?: boolean
  sidebarCollapsed?: boolean
  onSidebarToggle?: () => void
  onWorktreeSelected?: () => void
}

export function AppLayout({
  children,
  onSettingsClick,
  hasCurrentRepository,
  sidebarCollapsed,
  onSidebarToggle,
  onWorktreeSelected,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen flex-col">
      <MainHeader
        onSettingsClick={onSettingsClick}
        hasCurrentRepository={hasCurrentRepository}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={onSidebarToggle}
        onWorktreeSelected={onWorktreeSelected}
      />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
