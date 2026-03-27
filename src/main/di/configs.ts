import type { VContainerConfig } from '@/shared/lib/di'
import { applicationFoundationMainConfig } from '@/main/features/application-foundation/di-config'

export const mainConfigs: VContainerConfig[] = [applicationFoundationMainConfig]
