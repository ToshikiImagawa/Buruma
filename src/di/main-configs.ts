import type { MainProcessConfig } from '@/lib/main-process'
import { applicationFoundationMainConfig } from '@/features/application-foundation/di-config-main'

export const mainProcessConfigs: MainProcessConfig[] = [applicationFoundationMainConfig]
