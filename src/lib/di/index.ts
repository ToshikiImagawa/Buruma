/**
 * Dependency Injectionライブラリのメインエクスポート。
 *
 * 軽量で型安全なDIコンテナを提供します。手動での依存関係解決を基本とし、
 * シンプルで理解しやすいAPIを提供しています。
 *
 * このライブラリは汎用的なDIコンテナのみを提供し、アプリケーション固有の
 * トークンやサービス定義は利用者側で行います。
 */

// コンテナクラス
export type { VContainer } from './container'

// トークン作成ユーティリティとグローバルインスタンス
export { createToken, createContainer, globalContainer } from './container'

// React Provider と Hooks
export {
  VContainerProvider,
  useVContainer,
  useResolve,
  useVContainerReady,
  useVContainerError,
} from './v-container-provider'
export type { VContainerProviderProps, VContainerConfig } from './v-container-provider'

// 型定義
export type {
  InjectionToken,
  Lazy,
  ServiceLifetime,
  ServiceMetadata,
  Type,
  Factory,
  Provider,
} from './types'
export { asLazy } from './types'

// DisposableStack
export { createDisposableStack, createCleanupHandle } from './disposable-stack'
export type {
  DisposableStack,
  DisposableStackResult,
  CleanupHandle,
  TearDownable,
} from './disposable-stack'
