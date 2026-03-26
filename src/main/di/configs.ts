import type { MainProcessConfig } from '@/shared/lib/main-process'
import { applicationFoundationMainConfig } from '@/main/features/application-foundation/di-config'

export const mainProcessConfigs: MainProcessConfig[] = [applicationFoundationMainConfig]
