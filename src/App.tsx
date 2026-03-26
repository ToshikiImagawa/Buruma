import { useState } from 'react'
import { Toaster } from 'sonner'
import { AppLayout } from '@/components/layout'
import { ThemeProvider } from '@/components/theme-provider'
import { applicationFoundationConfig } from '@/features/application-foundation/di-config'
import {
  ErrorNotificationToast,
  RepositorySelectorDialog,
  SettingsDialog,
} from '@/features/application-foundation/presentation/components'
import { useRepositorySelectorViewModel } from '@/features/application-foundation/presentation/use-repository-selector-viewmodel'
import { VContainerProvider } from '@/lib/di/v-container-provider'

function AppContent() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [repositorySelectorOpen, setRepositorySelectorOpen] = useState(true)
  const { currentRepository } = useRepositorySelectorViewModel()

  return (
    <>
      <AppLayout onSettingsClick={() => setSettingsOpen(true)}>
        {currentRepository ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold">{currentRepository.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{currentRepository.path}</p>
              <p className="mt-4 text-muted-foreground">ワークツリー管理画面（今後実装予定）</p>
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
    <VContainerProvider configs={[applicationFoundationConfig]}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </VContainerProvider>
  )
}

export default App
