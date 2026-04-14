import type { VContainerConfig } from '@lib/di'
import { advancedGitOperationsConfig } from '@/features/advanced-git-operations/di-config'
import { applicationFoundationConfig } from '@/features/application-foundation/di-config'
import { basicGitOperationsConfig } from '@/features/basic-git-operations/di-config'
import { claudeCodeIntegrationConfig } from '@/features/claude-code-integration/di-config'
import { repositoryViewerConfig } from '@/features/repository-viewer/di-config'
import { worktreeManagementConfig } from '@/features/worktree-management/di-config'

export const rendererConfigs: VContainerConfig[] = [
  applicationFoundationConfig,
  worktreeManagementConfig,
  repositoryViewerConfig,
  basicGitOperationsConfig,
  advancedGitOperationsConfig,
  claudeCodeIntegrationConfig,
]
