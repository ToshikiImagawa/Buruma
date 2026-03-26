import type { VContainerConfig } from '@/shared/lib/di'
import { applicationFoundationConfig } from '@/renderer/features/application-foundation/di-config'

export const rendererConfigs: VContainerConfig[] = [applicationFoundationConfig]
