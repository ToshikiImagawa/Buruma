import type { DisposableStack } from '@/shared/lib/di'
import type { MainProcessConfig } from './types'
import { createDisposableStack } from '@/shared/lib/di'

/**
 * MainProcessConfig の配列を受け取り、priority 順に初期化を実行する。
 *
 * @remarks
 * VContainerProvider の setUp 実行ロジックと同じ priority グルーピングを適用:
 * - 同じ priority のconfig は並行実行（Promise.all）
 * - 異なる priority は直列実行（小さい値が先）
 * - dispose は DisposableStack で LIFO 管理
 *
 * @param configs - 初期化する MainProcessConfig の配列
 * @returns DisposableStack - dispose() で全 config のクリーンアップを実行
 */
export async function bootstrapMainProcess(configs: MainProcessConfig[]): Promise<DisposableStack> {
  const stack = createDisposableStack()

  const priorityGroups = new Map<number, MainProcessConfig[]>()
  for (const config of configs) {
    const priority = config.priority ?? 0
    const group = priorityGroups.get(priority) ?? []
    group.push(config)
    priorityGroups.set(priority, group)
  }

  const sortedPriorities = [...priorityGroups.keys()].sort((a, b) => a - b)

  for (const priority of sortedPriorities) {
    const group = priorityGroups.get(priority)!
    await Promise.all(group.map((c) => c.initialize()))
    for (const config of group) {
      stack.defer(() => config.dispose())
    }
  }

  return stack
}
