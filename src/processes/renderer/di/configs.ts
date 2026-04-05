import type { VContainerConfig } from '@lib/di'
import { advancedGitOperationsConfig } from '@renderer/features/advanced-git-operations/di-config'
import { applicationFoundationConfig } from '@renderer/features/application-foundation/di-config'
import { basicGitOperationsConfig } from '@renderer/features/basic-git-operations/di-config'
import { claudeCodeIntegrationConfig } from '@renderer/features/claude-code-integration/di-config'
import { repositoryViewerConfig } from '@renderer/features/repository-viewer/di-config'
import { worktreeManagementConfig } from '@renderer/features/worktree-management/di-config'

export const rendererConfigs: VContainerConfig[] = [
  applicationFoundationConfig,
  worktreeManagementConfig,
  repositoryViewerConfig,
  basicGitOperationsConfig,
  advancedGitOperationsConfig,
  claudeCodeIntegrationConfig,
]
