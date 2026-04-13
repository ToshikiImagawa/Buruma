import { useState } from 'react'
import { VContainerProvider } from '@lib/di/v-container-provider'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/components/error-boundary'
import { AppLayout } from '@/components/layout'
import { ThemeProvider } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { rendererConfigs } from '@/di/configs'
import {
  ErrorNotificationToast,
  RepositorySelectorDialog,
  SettingsDialog,
} from '@/features/application-foundation/presentation/components'
import { useRepositorySelectorViewModel } from '@/features/application-foundation/presentation/use-repository-selector-viewmodel'
import { RepositoryDetailPanel } from '@/features/repository-viewer/presentation/components'
import { SymlinkSettingsSection, WorktreeList } from '@/features/worktree-management/presentation/components'

function AppContent() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [repositorySelectorOpen, setRepositorySelectorOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { currentRepository } = useRepositorySelectorViewModel()

  return (
    <>
      <AppLayout
        onSettingsClick={() => setSettingsOpen(true)}
        hasCurrentRepository={!!currentRepository}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={() => setSidebarCollapsed((prev) => !prev)}
        onWorktreeSelected={() => setSidebarCollapsed(true)}
      >
        {currentRepository ? (
          <div className="flex h-full">
            <aside
              className={`shrink-0 border-r transition-all duration-200 ${sidebarCollapsed ? 'w-0 overflow-hidden border-r-0' : 'w-64'}`}
            >
              <WorktreeList repoPath={currentRepository.path} onWorktreeSelected={() => setSidebarCollapsed(true)} />
            </aside>
            <div className="flex-1 overflow-hidden">
              <RepositoryDetailPanel />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">リポジトリが選択されていません</p>
            <Button onClick={() => setRepositorySelectorOpen(true)}>リポジトリを開く</Button>
          </div>
        )}
      </AppLayout>

      <RepositorySelectorDialog open={repositorySelectorOpen} onOpenChange={setRepositorySelectorOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SymlinkSettingsSection repoPath={currentRepository?.path ?? null} />
      </SettingsDialog>
      <ErrorNotificationToast />
      <Toaster />
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <VContainerProvider configs={rendererConfigs}>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </VContainerProvider>
    </ErrorBoundary>
  )
}

export default App
