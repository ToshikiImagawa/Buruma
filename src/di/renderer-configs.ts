import type { VContainerConfig } from '@/lib/di'
import { applicationFoundationConfig } from '@/features/application-foundation/di-config'

export const rendererConfigs: VContainerConfig[] = [applicationFoundationConfig]
