import { useState } from 'react'
import { VContainerProvider } from '@lib/di/v-container-provider'
import { ErrorBoundary } from '@renderer/components/error-boundary'
import { AppLayout } from '@renderer/components/layout'
import { ThemeProvider } from '@renderer/components/theme-provider'
import { Button } from '@renderer/components/ui/button'
import { rendererConfigs } from '@renderer/di/configs'
import {
  ErrorNotificationToast,
  RepositorySelectorDialog,
  SettingsDialog,
} from '@renderer/features/application-foundation/presentation/components'
import { useRepositorySelectorViewModel } from '@renderer/features/application-foundation/presentation/use-repository-selector-viewmodel'
import { RepositoryDetailPanel } from '@renderer/features/repository-viewer/presentation/components'
import { WorktreeList } from '@renderer/features/worktree-management/presentation/components'
import { Toaster } from 'sonner'

function AppContent() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [repositorySelectorOpen, setRepositorySelectorOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { currentRepository } = useRepositorySelectorViewModel()

  return (
    <>
      <AppLayout
        onSettingsClick={() => setSettingsOpen(true)}
        repositoryName={currentRepository?.name}
        onRepositorySwitch={() => setRepositorySelectorOpen(true)}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={() => setSidebarCollapsed((prev) => !prev)}
      >
        {currentRepository ? (
          <div className="flex h-full">
            <aside
              className={`shrink-0 border-r transition-all duration-200 ${sidebarCollapsed ? 'w-0 overflow-hidden border-r-0' : 'w-64'}`}
            >
              <WorktreeList repoPath={currentRepository.path} />
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
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
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
