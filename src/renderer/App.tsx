import { useState } from 'react'
import { AppLayout } from '@renderer/components/layout'
import { ThemeProvider } from '@renderer/components/theme-provider'
import { rendererConfigs } from '@renderer/di/configs'
import {
  ErrorNotificationToast,
  RepositorySelectorDialog,
  SettingsDialog,
} from '@renderer/features/application-foundation/presentation/components'
import { useRepositorySelectorViewModel } from '@renderer/features/application-foundation/presentation/use-repository-selector-viewmodel'
import { WorktreeDetail, WorktreeList } from '@renderer/features/worktree-management/presentation/components'
import { VContainerProvider } from '@shared/lib/di/v-container-provider'
import { Toaster } from 'sonner'

function AppContent() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [repositorySelectorOpen, setRepositorySelectorOpen] = useState(true)
  const { currentRepository } = useRepositorySelectorViewModel()

  return (
    <>
      <AppLayout onSettingsClick={() => setSettingsOpen(true)}>
        {currentRepository ? (
          <div className="flex h-full">
            <aside className="w-64 shrink-0 border-r">
              <WorktreeList repoPath={currentRepository.path} />
            </aside>
            <div className="flex-1 overflow-auto">
              <WorktreeDetail />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">リポジトリを選択してください</p>
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
    <VContainerProvider configs={rendererConfigs}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </VContainerProvider>
  )
}

export default App
