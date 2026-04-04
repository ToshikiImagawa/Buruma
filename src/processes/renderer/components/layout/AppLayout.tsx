import { ReactNode } from 'react'
import { MainHeader } from './MainHeader'

interface AppLayoutProps {
  children: ReactNode
  onSettingsClick: () => void
  repositoryName?: string
  onRepositorySwitch?: () => void
  sidebarCollapsed?: boolean
  onSidebarToggle?: () => void
}

export function AppLayout({
  children,
  onSettingsClick,
  repositoryName,
  onRepositorySwitch,
  sidebarCollapsed,
  onSidebarToggle,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen flex-col">
      <MainHeader
        onSettingsClick={onSettingsClick}
        repositoryName={repositoryName}
        onRepositorySwitch={onRepositorySwitch}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={onSidebarToggle}
      />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
