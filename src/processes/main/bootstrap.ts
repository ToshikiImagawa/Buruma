import type { VContainerConfig } from '@lib/di'
import type { VContainer } from '@lib/di/container'
import type { DisposableStack } from '@lib/di/disposable-stack'
import { createContainer, createDisposableStack } from '@lib/di'

export interface BootstrapResult {
  container: VContainer
  cleanup: DisposableStack
}

/**
 * VContainerConfig の配列を受け取り、register → setUp（priority 順）を実行する。
 * VContainerProvider のメインプロセス版。
 */
export async function bootstrapContainer(configs: VContainerConfig[]): Promise<BootstrapResult> {
  const container = createContainer()
  const cleanup = createDisposableStack()

  // Register
  for (const config of configs) {
    config.register?.(container)
  }

  // SetUp in priority order
  const priorityGroups = new Map<number, VContainerConfig[]>()
  for (const config of configs) {
    if (!config.setUp) continue
    const priority = config.priority ?? 0
    const group = priorityGroups.get(priority) ?? []
    group.push(config)
    priorityGroups.set(priority, group)
  }

  const sortedPriorities = [...priorityGroups.keys()].sort((a, b) => a - b)
  for (const priority of sortedPriorities) {
    const group = priorityGroups.get(priority)!
    const tearDowns = await Promise.all(group.map((config) => config.setUp!(container)))
    for (const tearDown of tearDowns) {
      if (typeof tearDown === 'function') {
        cleanup.defer(tearDown)
      }
    }
  }

  return { container, cleanup }
}
