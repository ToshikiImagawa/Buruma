import { ReactNode, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { VContainer } from './container'
import type { DisposableStack } from './disposable-stack'
import { logger } from '../../utils'
import { createContainer } from './container'
import { createDisposableStack } from './disposable-stack'

/**
 * コンテナの登録関数
 * @param container - DIコンテナインスタンス
 */
type RegisterFn = (container: VContainer) => void

/**
 * コンテナのセットアップ関数（非同期対応）
 * @param container - DIコンテナインスタンス
 * @return セットアップ処理のPromise（オプション）
 */
type SetupFn = (container: VContainer) => Promise<() => void>

export type VContainerConfig = {
  register?: RegisterFn
  setUp?: SetupFn
  /**
   * setUpの実行優先度（小さい値が先に実行される）
   * 同じpriorityのsetUpは並行実行され、異なるpriority間は直列実行される
   * @default 0
   */
  priority?: number
}

// Contextが提供する値の型
interface VContainerContextType {
  container: VContainer
  isReady: boolean
  error: Error | null
}

const VContainerContext = createContext<VContainerContextType | null>(null)

export type VContainerProviderProps = {
  children: ReactNode | ((state: { isReady: boolean; error: Error | null }) => ReactNode)
  configs: VContainerConfig[]
  parent?: VContainer // 親コンテナ（オプション）
  /**
   * ローディング時に表示するフォールバックUI
   * 指定しない場合は何も表示されません（nullを返す）
   *
   * 注: childrenが関数の場合は無視されます
   */
  fallback?: ReactNode
  /**
   * エラー時に表示するフォールバックUI
   * 指定しない場合は、エラーをコンソールに出力してスローします
   *
   * 注: childrenが関数の場合は無視されます
   */
  errorFallback?: (error: Error) => ReactNode
}

/**
 * DIコンテナプロバイダー
 *
 * @remarks
 * - containerは初回マウント時に一度だけ作成されます
 * - parentプロパティの変更は無視されます（初回値のみ使用）
 * - configsプロパティの変更は無視されます（初回値のみ使用）
 * - React Strict Modeでの二重実行に対応しています
 * - 設定を変更する場合は、コンポーネントをアンマウントして再マウントしてください
 */
export const VContainerProvider = ({
  children,
  parent,
  configs,
  fallback = null,
  errorFallback,
}: VContainerProviderProps) => {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const stackRef = useRef<DisposableStack | null>(null)

  // コンテナインスタンスは一度だけ作成され、再レンダリング間で保持されます
  const containerRef = useRef(createContainer(parent))

  // 初期化フラグ：Strict Modeでの二重実行を防ぐため
  const initRef = useRef(false)

  useEffect(() => {
    // 既に初期化済みの場合は何もしない
    if (initRef.current) return
    initRef.current = true

    const container = containerRef.current

    // 注意: ここで使用されるconfigsは、コンポーネントが最初にマウントされた時点のpropsです
    // propsのconfigsが後で変更されても、コンテナは再初期化されません

    // 1. すべてのregisterを実行
    configs.forEach((config) => {
      if (config.register) {
        config.register(container)
      }
    })

    // 2. すべてのsetUpをpriority順に実行
    // 同じpriorityのsetUpは並行実行、異なるpriority間は直列実行
    const configsWithSetUp = configs.filter((config) => config.setUp)

    // priorityでグループ化（昇順ソート）
    const priorityGroups = new Map<number, VContainerConfig[]>()
    for (const config of configsWithSetUp) {
      const priority = config.priority ?? 0
      const group = priorityGroups.get(priority) ?? []
      group.push(config)
      priorityGroups.set(priority, group)
    }
    const sortedPriorities = [...priorityGroups.keys()].sort((a, b) => a - b)

    const runSetUps = async () => {
      const stack = createDisposableStack()
      const setUpErrors: Error[] = []

      for (const priority of sortedPriorities) {
        const group = priorityGroups.get(priority)!
        const promises = group.map((config) => Promise.resolve(config.setUp!(container)))
        const results = await Promise.allSettled(promises)

        for (const r of results) {
          if (r.status === 'fulfilled') {
            stack.defer(r.value)
          } else {
            setUpErrors.push(r.reason instanceof Error ? r.reason : new Error(String(r.reason)))
          }
        }

        // エラーが発生した場合は後続のpriorityグループを実行しない
        if (setUpErrors.length > 0) {
          break
        }
      }

      stackRef.current = stack

      if (setUpErrors.length > 0) {
        const result = stack.dispose()
        if (!result.success) {
          logger.error('[VContainerProvider] setUp失敗後のクリーンアップ中にエラーが発生しました:', result.errors)
        }
        logger.error('[VContainerProvider] Container setup failed:', setUpErrors)
        setError(setUpErrors[0])
        return
      }

      setIsReady(true)
    }

    runSetUps().catch((error) => {
      logger.error('[VContainerProvider] Container setup failed:', error)
      setError(error)
    })

    return () => {
      if (!stackRef.current) return
      const result = stackRef.current.dispose()
      if (!result.success) {
        logger.error('[VContainerProvider] tearDown中にエラーが発生しました:', result.errors)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 初回マウント時のみ実行（initRefで二重実行を防止）

  const value = useMemo(() => {
    return { container: containerRef.current, isReady, error }
  }, [error, isReady])

  // children が関数の場合は、状態を渡して実行（render propsパターン）
  if (typeof children === 'function') {
    return <VContainerContext.Provider value={value}>{children({ isReady, error })}</VContainerContext.Provider>
  }

  // children が ReactNode の場合は、fallback/errorFallbackパターンを使用
  return (
    <VContainerContext.Provider value={value}>
      {error ? (
        errorFallback ? (
          <>{errorFallback(error)}</>
        ) : (
          // デフォルトのエラー処理: エラーをスロー
          (() => {
            throw error
          })()
        )
      ) : isReady ? (
        children
      ) : (
        <>{fallback}</>
      )}
    </VContainerContext.Provider>
  )
}

export const useVContainer = (): VContainer => {
  const context = useContext(VContainerContext)
  if (!context) {
    throw new Error('useVContainer must be used within VContainerProvider')
  }
  if (!context.isReady) {
    throw new Error('Container is not ready yet')
  }
  return context.container
}

export const useVContainerReady = (): boolean => {
  const context = useContext(VContainerContext)
  return context?.isReady ?? false
}

export const useVContainerError = (): Error | null => {
  const context = useContext(VContainerContext)
  return context?.error ?? null
}
