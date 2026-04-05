import type { VContainerConfig } from '@lib/di'
import { advancedGitOperationsMainConfig } from '@main/features/advanced-git-operations/di-config'
import { applicationFoundationMainConfig } from '@main/features/application-foundation/di-config'
import { basicGitOperationsMainConfig } from '@main/features/basic-git-operations/di-config'
import { claudeCodeIntegrationMainConfig } from '@main/features/claude-code-integration/di-config'
import { repositoryViewerMainConfig } from '@main/features/repository-viewer/di-config'
import { worktreeManagementMainConfig } from '@main/features/worktree-management/di-config'

export const mainConfigs: VContainerConfig[] = [
  applicationFoundationMainConfig,
  worktreeManagementMainConfig,
  repositoryViewerMainConfig,
  basicGitOperationsMainConfig,
  advancedGitOperationsMainConfig,
  claudeCodeIntegrationMainConfig,
]
