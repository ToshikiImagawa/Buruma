import type { VContainerConfig } from '@shared/lib/di'
import { applicationFoundationConfig } from '@renderer/features/application-foundation/di-config'
import { worktreeManagementConfig } from '@renderer/features/worktree-management/di-config'

export const rendererConfigs: VContainerConfig[] = [applicationFoundationConfig, worktreeManagementConfig]
