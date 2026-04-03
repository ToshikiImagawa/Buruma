import { ReactNode } from 'react'
import { MainHeader } from './MainHeader'

interface AppLayoutProps {
  children: ReactNode
  onSettingsClick: () => void
}

export function AppLayout({ children, onSettingsClick }: AppLayoutProps) {
  return (
    <div className="flex h-screen flex-col">
      <MainHeader onSettingsClick={onSettingsClick} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
