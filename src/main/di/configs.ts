import type { VContainerConfig } from '@shared/lib/di'
import { applicationFoundationMainConfig } from '@main/features/application-foundation/di-config'
import { basicGitOperationsMainConfig } from '@main/features/basic-git-operations/di-config'
import { repositoryViewerMainConfig } from '@main/features/repository-viewer/di-config'
import { worktreeManagementMainConfig } from '@main/features/worktree-management/di-config'

export const mainConfigs: VContainerConfig[] = [
  applicationFoundationMainConfig,
  worktreeManagementMainConfig,
  repositoryViewerMainConfig,
  basicGitOperationsMainConfig,
]
